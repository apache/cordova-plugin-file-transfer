---
license: Licensed to the Apache Software Foundation (ASF) under one
         or more contributor license agreements.  See the NOTICE file
         distributed with this work for additional information
         regarding copyright ownership.  The ASF licenses this file
         to you under the Apache License, Version 2.0 (the
         "License"); you may not use this file except in compliance
         with the License.  You may obtain a copy of the License at

           http://www.apache.org/licenses/LICENSE-2.0

         Unless required by applicable law or agreed to in writing,
         software distributed under the License is distributed on an
         "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
         KIND, either express or implied.  See the License for the
         specific language governing permissions and limitations
         under the License.
---

FileTransfer
==========

The `FileTransfer` object allows you to upload or download files to
and from a server.

Properties
----------

- __onprogress__: Called with a `ProgressEvent` whenever a new chunk of data is transferred. _(Function)_

Methods
-------

- __upload__: sends a file to a server.
- __download__: downloads a file from server.
- __abort__: Aborts an in-progress transfer.

Details
-------

The `FileTransfer` object provides a way to upload files to a remote
server using an HTTP multi-part POST request.  Both HTTP and HTTPS
protocols are supported.  Optional parameters can be specified by
passing a `FileUploadOptions` object to the `upload()` method.  On
successful upload, a `FileUploadResult` object is passed to the
success callback.  If an error occurs, a `FileTransferError` object is
passed to the error callback.  It is also possible (only on iOS and
Android) to download a file from a remote server and save it on the
device.

Supported Platforms
-------------------

- Android
- BlackBerry WebWorks (OS 5.0 and higher)
- iOS
- Windows Phone 7 and 8
- Windows 8

upload
--------------

__Parameters:__

- __filePath__: Full path of the file on the device.
- __server__: URL of the server to receive the file, as encoded by `encodeURI()`.
- __successCallback__: A callback that is passed a `Metadata` object. _(Function)_
- __errorCallback__: A callback that executes if an error occurs retrieving the `Metadata`. Invoked with a `FileTransferError` object. _(Function)_
- __options__: Optional parameters such as file name and mimetype.
- __trustAllHosts__: Optional parameter, defaults to `false`. If set to true, it accepts all security certificates. This is useful since Android rejects self-signed security certificates. Not recommended for production use. Supported on Android and iOS. _(boolean)_

__Quick Example__

    // !! Assumes variable fileURI contains a valid URI to a text file on the device

    var win = function (r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
    }

    var fail = function (error) {
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }

    var options = new FileUploadOptions();
    options.fileKey = "file";
    options.fileName = fileURI.substr(fileURI.lastIndexOf('/') + 1);
    options.mimeType = "text/plain";

    var params = {};
    params.value1 = "test";
    params.value2 = "param";

    options.params = params;

    var ft = new FileTransfer();
    ft.upload(fileURI, encodeURI("http://some.server.com/upload.php"), win, fail, options);

__Full Example__

    <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
    <html>
    <head>
        <title>File Transfer Example</title>

        <script type="text/javascript" charset="utf-8" src="cordova-x.x.x.js"></script>
        <script type="text/javascript" charset="utf-8">

            // Wait for device API libraries to load
            //
            document.addEventListener("deviceready", onDeviceReady, false);

            // device APIs are available
            //
            function onDeviceReady() {
                // Retrieve image file location from specified source
                navigator.camera.getPicture(
                    uploadPhoto,
                    function(message) { alert('get picture failed'); },
                    {
                        quality         : 50,
                        destinationType : navigator.camera.DestinationType.FILE_URI,
                        sourceType      : navigator.camera.PictureSourceType.PHOTOLIBRARY
                    }
                );
            }

            function uploadPhoto(imageURI) {
                var options = new FileUploadOptions();
                options.fileKey="file";
                options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
                options.mimeType="image/jpeg";

                var params = {};
                params.value1 = "test";
                params.value2 = "param";

                options.params = params;

                var ft = new FileTransfer();
                ft.upload(imageURI, encodeURI("http://some.server.com/upload.php"), win, fail, options);
            }

            function win(r) {
                console.log("Code = " + r.responseCode);
                console.log("Response = " + r.response);
                console.log("Sent = " + r.bytesSent);
            }

            function fail(error) {
                alert("An error has occurred: Code = " + error.code);
                console.log("upload error source " + error.source);
                console.log("upload error target " + error.target);
            }

            </script>
    </head>
    <body>
        <h1>Example</h1>
        <p>Upload File</p>
    </body>
    </html>

__Setting Upload Headers__

Supported on Android and iOS

    function win(r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
    }

    function fail(error) {
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }

    var uri = encodeURI("http://some.server.com/upload.php");

    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName=fileURI.substr(fileURI.lastIndexOf('/')+1);
    options.mimeType="text/plain";

    var headers={'headerParam':'headerValue'};

    options.headers = headers;

    var ft = new FileTransfer();
    ft.upload(fileURI, uri, win, fail, options);

__Android Quirks__

Set the `chunkedMode` option to `false` to prevent problems uploading
to a Nginx server.

download
--------------

__Parameters:__

- __source__: URL of the server to download the file, as encoded by `encodeURI()`.
- __target__: Full path of the file on the device.
- __successCallback__: A callback that is passed  a `FileEntry` object. _(Function)_
- __errorCallback__: A callback that executes if an error occurs when retrieving the `Metadata`. Invoked with a `FileTransferError` object. _(Function)_
- __trustAllHosts__: Optional parameter, defaults to `false`. If set to `true` then it will accept all security certificates. This is useful as Android rejects self signed security certificates. Not recommended for production use. Supported on Android and iOS. _(boolean)_
- __options__: Optional parameters, currently only supports headers (such as Authorization (Basic Authentication), etc).

__Quick Example__

    // !! Assumes filePath is a valid path on the device

    var fileTransfer = new FileTransfer();
    var uri = encodeURI("http://some.server.com/download.php");

    fileTransfer.download(
        uri,
        filePath,
        function(entry) {
            console.log("download complete: " + entry.fullPath);
        },
        function(error) {
            console.log("download error source " + error.source);
            console.log("download error target " + error.target);
            console.log("upload error code" + error.code);
        },
        false,
        {
            headers: {
                "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
            }
        }
    );

abort
--------------

Aborts an in-progress transfer. The onerror callback is passed a FileTransferError object which has an error code of FileTransferError.ABORT_ERR.

__Supported Platforms__

- Android
- iOS

__Quick Example__

    // !! Assumes variable fileURI contains a valid URI to a text file on the device

          var win = function(r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
        }

    var fail = function(error) {
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }

        var options = new FileUploadOptions();
        options.fileKey="file";
        options.fileName=fileURI.substr(fileURI.lastIndexOf('/')+1);
        options.mimeType="text/plain";

    var params = {};
        params.value1 = "test";
        params.value2 = "param";

        options.params = params;

        var ft = new FileTransfer();
    ft.upload(fileURI, encodeURI("http://some.server.com/upload.php"), win, fail, options);
    ft.abort(win, fail);

onprogress
--------------

Called with a ProgressEvent whenever a new chunk of data is transferred.

__Supported Platforms__

- Android
- iOS

__Example__

    fileTransfer.onprogress = function(progressEvent) {
        if (progressEvent.lengthComputable) {
          loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);
        } else {
          loadingStatus.increment();
        }
    };
    fileTransfer.download(...); // or fileTransfer.upload(...);

__Quirks__
- On both Android an iOS, lengthComputable is false for downloads that use gzip encoding.
