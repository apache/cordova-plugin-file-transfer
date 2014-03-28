/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/


var FileTransferError = require('./FileTransferError'),
    FileUploadResult = require('org.apache.cordova.file.FileUploadResult'),
    FileEntry = require('org.apache.cordova.file.FileEntry');

module.exports = {

    upload:function(successCallback, error, options) {
        var filePath = options[0];
        var server = options[1];
        var headers = options[8] || {};
        var httpMethod = options[10] || "POST";

        if (filePath === null || typeof filePath === 'undefined') {
            error && error(FileTransferError.FILE_NOT_FOUND_ERR);
            return;
        }

        if (String(filePath).substr(0, 8) == "file:///") {
            filePath = Windows.Storage.ApplicationData.current.localFolder.path + String(filePath).substr(8).split("/").join("\\");
        }

        Windows.Storage.StorageFile.getFileFromPathAsync(filePath).then(function (storageFile) {
            var ftResult = new FileUploadResult();
            var sc = function () {
                successCallback && successCallback(ftResult);
            };

            var uri = Windows.Foundation.Uri(server);
            var uploader = new Windows.Networking.BackgroundTransfer.BackgroundUploader();
            uploader.method = httpMethod;
            for (var header in headers) {
                uploader.setRequestHeader(header, headers[header]);
            }
            var upload = uploader.createUpload(uri, storageFile);

            upload.startAsync().then(function (res) {
                var total = res.progress.totalBytesToSend;
                var size = res.progress.totalBytesToReceive;
                var info = res.getResponseInformation();
                var ftResult = new FileUploadResult(total, info.statusCode, size.toString());

                var sc = function () {
                    successCallback && successCallback(ftResult);
                };

                var istream = upload.getResultStreamAt(0);
                var buffer =  new Windows.Storage.Streams.Buffer(size);
                istream.readAsync(buffer, size, Windows.Storage.Streams.InputStreamOptions.none).done(
                    function(f){
                        var dataReader = Windows.Storage.Streams.DataReader.fromBuffer(f);
                        ftResult.response = dataReader.readString(dataReader.unconsumedBufferLength);
                        sc();
                    },
                    function(e){
                        sc();
                    });
            }, function (e) {
                error && error(FileTransferError.INVALID_URL_ERR);
            }, function (v) {
                successCallback({
                    lengthComputable: (upload.progress.totalBytesToSend != 0),
                    total: upload.progress.totalBytesToSend,
                    loaded: upload.progress.bytesSent,
                },
                {
                    status:cordova.callbackStatus.OK,
                    keepCallback: true,
                });
            });
        },function() {
            error && error(FileTransferError.FILE_NOT_FOUND_ERR);
        });
    },

    download:function(successCallback, error, options) {
        var source = options[0];
        var target = options[1];
        var headers = options[4] || {};


        if (target === null || typeof target === undefined) {
            error && error(FileTransferError.FILE_NOT_FOUND_ERR);
            return;
        }
        if (String(target).substr(0, 8) == "file:///") {
            target = Windows.Storage.ApplicationData.current.localFolder.path + String(target).substr(8).split("/").join("\\");
        }
        var path = target.substr(0, String(target).lastIndexOf("\\"));
        var fileName = target.substr(String(target).lastIndexOf("\\") + 1);
        if (path === null || fileName === null) {
            error && error(FileTransferError.FILE_NOT_FOUND_ERR);
            return;
        }

        var download = null;


        Windows.Storage.StorageFolder.getFolderFromPathAsync(path).then(function (storageFolder) {
            storageFolder.createFileAsync(fileName, Windows.Storage.CreationCollisionOption.generateUniqueName).then(function (storageFile) {
                var uri = Windows.Foundation.Uri(source);
                var downloader = new Windows.Networking.BackgroundTransfer.BackgroundDownloader();

                for (var header in headers) {
                    downloader.setRequestHeader(header, headers[header]);
                }


                download = downloader.createDownload(uri, storageFile);
                download.startAsync().then(function () {
                    successCallback && successCallback(new FileEntry(storageFile.name, storageFile.path));
                }, function () {
                    error && error(FileTransferError.INVALID_URL_ERR);
                }, function (v) {
                    successCallback({
                        lengthComputable: (download.progress.totalBytesToReceive != 0),
                        total: download.progress.totalBytesToReceive,
                        loaded: download.progress.bytesReceived,
                    },
                    {
                        status:cordova.callbackStatus.OK,
                        keepCallback: true,
                    });
                });
            });
        });
    }
};

require("cordova/windows8/commandProxy").add("FileTransfer",module.exports);
