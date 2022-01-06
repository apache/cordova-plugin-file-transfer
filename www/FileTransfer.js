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

/* global cordova, FileSystem */

const argscheck = require('cordova/argscheck');
const exec = require('cordova/exec');
const FileTransferError = require('./FileTransferError');
const ProgressEvent = require('cordova-plugin-file.ProgressEvent');

function newProgressEvent (result) {
    const pe = new ProgressEvent();
    pe.lengthComputable = result.lengthComputable;
    pe.loaded = result.loaded;
    pe.total = result.total;
    return pe;
}

function getUrlCredentials (urlString) {
    const credentialsPattern = /^https?:\/\/(?:(?:(([^:@/]*)(?::([^@/]*))?)?@)?([^:/?#]*)(?::(\d*))?).*$/;
    const credentials = credentialsPattern.exec(urlString);

    return credentials && credentials[1];
}

function getBasicAuthHeader (urlString) {
    let header = null;

    // This is changed due to MS Windows doesn't support credentials in http uris
    // so we detect them by regexp and strip off from result url
    // Proof: http://social.msdn.microsoft.com/Forums/windowsapps/en-US/a327cf3c-f033-4a54-8b7f-03c56ba3203f/windows-foundation-uri-security-problem

    if (window.btoa) {
        const credentials = getUrlCredentials(urlString);
        if (credentials) {
            const authHeader = 'Authorization';
            const authHeaderValue = 'Basic ' + window.btoa(credentials);

            header = {
                name: authHeader,
                value: authHeaderValue
            };
        }
    }

    return header;
}

function convertHeadersToArray (headers) {
    const result = [];
    for (const header in headers) {
        if (Object.prototype.hasOwnProperty.call(headers, header)) {
            const headerValue = headers[header];
            result.push({
                name: header,
                value: headerValue.toString()
            });
        }
    }
    return result;
}

let idCounter = 0;

/**
 * FileTransfer uploads a file to a remote server.
 * @constructor
 */
const FileTransfer = function () {
    this._id = ++idCounter;
    this.onprogress = null; // optional callback
};

/**
 * Given an absolute file path, uploads a file on the device to a remote server
 * using a multipart HTTP request.
 * @param filePath {String}           Full path of the file on the device
 * @param server {String}             URL of the server to receive the file
 * @param successCallback (Function}  Callback to be invoked when upload has completed
 * @param errorCallback {Function}    Callback to be invoked upon error
 * @param options {FileUploadOptions} Optional parameters such as file name and mimetype
 * @param trustAllHosts {Boolean} Optional trust all hosts (e.g. for self-signed certs), defaults to false
 */
FileTransfer.prototype.upload = function (filePath, server, successCallback, errorCallback, options, trustAllHosts) {
    argscheck.checkArgs('ssFFO*', 'FileTransfer.upload', arguments);
    // check for options
    let fileKey = null;
    let fileName = null;
    let mimeType = null;
    let params = null;
    let chunkedMode = true;
    let headers = null;
    let httpMethod = null;
    const basicAuthHeader = getBasicAuthHeader(server);
    if (basicAuthHeader) {
        server = server.replace(getUrlCredentials(server) + '@', '');

        options = options || {};
        options.headers = options.headers || {};
        options.headers[basicAuthHeader.name] = basicAuthHeader.value;
    }

    if (options) {
        fileKey = options.fileKey;
        fileName = options.fileName;
        mimeType = options.mimeType;
        headers = options.headers;
        httpMethod = options.httpMethod || 'POST';
        if (httpMethod.toUpperCase() === 'PUT') {
            httpMethod = 'PUT';
        } else {
            httpMethod = 'POST';
        }
        if (options.chunkedMode !== null || typeof options.chunkedMode !== 'undefined') {
            chunkedMode = options.chunkedMode;
        }
        if (options.params) {
            params = options.params;
        } else {
            params = {};
        }
    }

    if (cordova.platformId === 'windowsphone') {
        headers = headers && convertHeadersToArray(headers);
        params = params && convertHeadersToArray(params);
    }

    const fail =
        errorCallback &&
        function (e) {
            const error = new FileTransferError(e.code, e.source, e.target, e.http_status, e.body, e.exception);
            errorCallback(error);
        };

    const self = this;
    const win = function (result) {
        if (typeof result.lengthComputable !== 'undefined') {
            if (self.onprogress) {
                self.onprogress(newProgressEvent(result));
            }
        } else {
            if (successCallback) {
                successCallback(result);
            }
        }
    };
    exec(win, fail, 'FileTransfer', 'upload', [
        filePath,
        server,
        fileKey,
        fileName,
        mimeType,
        params,
        trustAllHosts,
        chunkedMode,
        headers,
        this._id,
        httpMethod
    ]);
};

/**
 * Downloads a file form a given URL and saves it to the specified directory.
 * @param source {String}          URL of the server to receive the file
 * @param target {String}         Full path of the file on the device
 * @param successCallback (Function}  Callback to be invoked when upload has completed
 * @param errorCallback {Function}    Callback to be invoked upon error
 * @param trustAllHosts {Boolean} Optional trust all hosts (e.g. for self-signed certs), defaults to false
 * @param options {FileDownloadOptions} Optional parameters such as headers
 */
FileTransfer.prototype.download = function (source, target, successCallback, errorCallback, trustAllHosts, options) {
    argscheck.checkArgs('ssFF*', 'FileTransfer.download', arguments);
    const self = this;

    const basicAuthHeader = getBasicAuthHeader(source);
    if (basicAuthHeader) {
        source = source.replace(getUrlCredentials(source) + '@', '');

        options = options || {};
        options.headers = options.headers || {};
        options.headers[basicAuthHeader.name] = basicAuthHeader.value;
    }

    let headers = null;
    if (options) {
        headers = options.headers || null;
    }

    if (cordova.platformId === 'windowsphone' && headers) {
        headers = convertHeadersToArray(headers);
    }

    const win = function (result) {
        if (typeof result.lengthComputable !== 'undefined') {
            if (self.onprogress) {
                return self.onprogress(newProgressEvent(result));
            }
        } else if (successCallback) {
            let entry = null;
            if (result.isDirectory) {
                entry = new (require('cordova-plugin-file.DirectoryEntry'))();
            } else if (result.isFile) {
                entry = new (require('cordova-plugin-file.FileEntry'))();
            }
            entry.isDirectory = result.isDirectory;
            entry.isFile = result.isFile;
            entry.name = result.name;
            entry.fullPath = result.fullPath;
            entry.filesystem = new FileSystem(
                result.filesystemName || (result.filesystem === window.PERSISTENT ? 'persistent' : 'temporary')
            );
            entry.nativeURL = result.nativeURL;
            successCallback(entry);
        }
    };

    const fail =
        errorCallback &&
        function (e) {
            const error = new FileTransferError(e.code, e.source, e.target, e.http_status, e.body, e.exception);
            errorCallback(error);
        };

    exec(win, fail, 'FileTransfer', 'download', [source, target, trustAllHosts, this._id, headers]);
};

/**
 * Aborts the ongoing file transfer on this object. The original error
 * callback for the file transfer will be called if necessary.
 */
FileTransfer.prototype.abort = function () {
    exec(null, null, 'FileTransfer', 'abort', [this._id]);
};

module.exports = FileTransfer;
