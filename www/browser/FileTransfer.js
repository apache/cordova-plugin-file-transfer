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

/* global FileUploadResult */

const argscheck = require('cordova/argscheck');
const FileTransferError = require('./FileTransferError');

function getParentPath (filePath) {
    const pos = filePath.lastIndexOf('/');
    return filePath.substring(0, pos + 1);
}

function getFileName (filePath) {
    const pos = filePath.lastIndexOf('/');
    return filePath.substring(pos + 1);
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

function checkURL (url) {
    return url.indexOf(' ') === -1;
}

let idCounter = 0;

const transfers = {};

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
FileTransfer.prototype.upload = function (filePath, server, successCallback, errorCallback, options) {
    // check for arguments
    argscheck.checkArgs('ssFFO*', 'FileTransfer.upload', arguments);

    // Check if target URL doesn't contain spaces. If contains, it should be escaped first
    // (see https://github.com/apache/cordova-plugin-file-transfer/blob/master/doc/index.md#upload)
    if (!checkURL(server)) {
        if (errorCallback) {
            errorCallback(new FileTransferError(FileTransferError.INVALID_URL_ERR, filePath, server));
        }
        return;
    }

    options = options || {};

    const fileKey = options.fileKey || 'file';
    const fileName = options.fileName || 'image.jpg';
    const mimeType = options.mimeType || 'image/jpeg';
    const params = options.params || {};
    const withCredentials = options.withCredentials || false;
    // var chunkedMode = !!options.chunkedMode; // Not supported
    const headers = options.headers || {};
    const httpMethod = options.httpMethod && options.httpMethod.toUpperCase() === 'PUT' ? 'PUT' : 'POST';

    const basicAuthHeader = getBasicAuthHeader(server);
    if (basicAuthHeader) {
        server = server.replace(getUrlCredentials(server) + '@', '');
        headers[basicAuthHeader.name] = basicAuthHeader.value;
    }

    const that = this;
    const xhr = (transfers[this._id] = new XMLHttpRequest());
    xhr.withCredentials = withCredentials;

    const fail =
        errorCallback &&
        function (code, status, response) {
            if (transfers[this._id]) {
                delete transfers[this._id];
            }
            const error = new FileTransferError(code, filePath, server, status, response);
            if (errorCallback) {
                errorCallback(error);
            }
        };

    window.resolveLocalFileSystemURL(
        filePath,
        function (entry) {
            entry.file(
                function (file) {
                    const reader = new FileReader();
                    reader.onloadend = function () {
                        const blob = new Blob([this.result], { type: mimeType });

                        // Prepare form data to send to server
                        const fd = new FormData();
                        fd.append(fileKey, blob, fileName);
                        for (const prop in params) {
                            if (Object.prototype.hasOwnProperty.call(params, prop)) {
                                fd.append(prop, params[prop]);
                            }
                        }

                        xhr.open(httpMethod, server);

                        // Fill XHR headers
                        for (const header in headers) {
                            if (Object.prototype.hasOwnProperty.call(headers, header)) {
                                xhr.setRequestHeader(header, headers[header]);
                            }
                        }

                        xhr.onload = function () {
                            // 2xx codes are valid
                            if (this.status >= 200 && this.status < 300) {
                                const result = new FileUploadResult();
                                result.bytesSent = blob.size;
                                result.responseCode = this.status;
                                result.response = this.response;
                                delete transfers[that._id];
                                successCallback(result);
                            } else if (this.status === 404) {
                                fail(FileTransferError.INVALID_URL_ERR, this.status, this.response);
                            } else {
                                fail(FileTransferError.CONNECTION_ERR, this.status, this.response);
                            }
                        };

                        xhr.ontimeout = function () {
                            fail(FileTransferError.CONNECTION_ERR, this.status, this.response);
                        };

                        xhr.onerror = function () {
                            fail(FileTransferError.CONNECTION_ERR, this.status, this.response);
                        };

                        xhr.onabort = function () {
                            fail(FileTransferError.ABORT_ERR, this.status, this.response);
                        };

                        xhr.upload.onprogress = function (e) {
                            if (that.onprogress) {
                                that.onprogress(e);
                            }
                        };

                        xhr.send(fd);
                        // Special case when transfer already aborted, but XHR isn't sent.
                        // In this case XHR won't fire an abort event, so we need to check if transfers record
                        // isn't deleted by filetransfer.abort and if so, call XHR's abort method again
                        if (!transfers[that._id]) {
                            xhr.abort();
                        }
                    };
                    reader.readAsArrayBuffer(file);
                },
                function () {
                    fail(FileTransferError.FILE_NOT_FOUND_ERR);
                }
            );
        },
        function () {
            fail(FileTransferError.FILE_NOT_FOUND_ERR);
        }
    );
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

    // Check if target URL doesn't contain spaces. If contains, it should be escaped first
    // (see https://github.com/apache/cordova-plugin-file-transfer/blob/master/doc/index.md#download)
    if (!checkURL(source)) {
        if (errorCallback) {
            errorCallback(new FileTransferError(FileTransferError.INVALID_URL_ERR, source, target));
        }
        return;
    }

    options = options || {};

    const headers = options.headers || {};
    const withCredentials = options.withCredentials || false;

    const basicAuthHeader = getBasicAuthHeader(source);
    if (basicAuthHeader) {
        source = source.replace(getUrlCredentials(source) + '@', '');
        headers[basicAuthHeader.name] = basicAuthHeader.value;
    }

    const that = this;
    const xhr = (transfers[this._id] = new XMLHttpRequest());
    xhr.withCredentials = withCredentials;
    const fail =
        errorCallback &&
        function (code, status, response) {
            if (transfers[that._id]) {
                delete transfers[that._id];
            }
            // In XHR GET reqests we're setting response type to Blob
            // but in case of error we need to raise event with plain text response
            if (response instanceof Blob) {
                const reader = new FileReader();
                reader.readAsText(response);
                reader.onloadend = function (e) {
                    const error = new FileTransferError(code, source, target, status, e.target.result);
                    errorCallback(error);
                };
            } else {
                const error = new FileTransferError(code, source, target, status, response);
                errorCallback(error);
            }
        };

    xhr.onload = function (e) {
        const fileNotFound = function () {
            fail(FileTransferError.FILE_NOT_FOUND_ERR);
        };

        const req = e.target;
        // req.status === 0 is special case for local files with file:// URI scheme
        if ((req.status === 200 || req.status === 0) && req.response) {
            window.resolveLocalFileSystemURL(
                getParentPath(target),
                function (dir) {
                    dir.getFile(
                        getFileName(target),
                        { create: true },
                        function writeFile (entry) {
                            entry.createWriter(function (fileWriter) {
                                fileWriter.onwriteend = function (evt) {
                                    if (!evt.target.error) {
                                        entry.filesystemName = entry.filesystem.name;
                                        delete transfers[that._id];
                                        if (successCallback) {
                                            successCallback(entry);
                                        }
                                    } else {
                                        fail(FileTransferError.FILE_NOT_FOUND_ERR);
                                    }
                                };
                                fileWriter.onerror = function () {
                                    fail(FileTransferError.FILE_NOT_FOUND_ERR);
                                };
                                fileWriter.write(req.response);
                            }, fileNotFound);
                        },
                        fileNotFound
                    );
                },
                fileNotFound
            );
        } else if (req.status === 404) {
            fail(FileTransferError.INVALID_URL_ERR, req.status, req.response);
        } else {
            fail(FileTransferError.CONNECTION_ERR, req.status, req.response);
        }
    };

    xhr.onprogress = function (e) {
        if (that.onprogress) {
            that.onprogress(e);
        }
    };

    xhr.onerror = function () {
        fail(FileTransferError.CONNECTION_ERR, this.status, this.response);
    };

    xhr.onabort = function () {
        fail(FileTransferError.ABORT_ERR, this.status, this.response);
    };

    xhr.open('GET', source, true);

    for (const header in headers) {
        if (Object.prototype.hasOwnProperty.call(headers, header)) {
            xhr.setRequestHeader(header, headers[header]);
        }
    }

    xhr.responseType = 'blob';

    xhr.send();
};

/**
 * Aborts the ongoing file transfer on this object. The original error
 * callback for the file transfer will be called if necessary.
 */
FileTransfer.prototype.abort = function () {
    if (this instanceof FileTransfer) {
        if (transfers[this._id]) {
            transfers[this._id].abort();
            delete transfers[this._id];
        }
    }
};

module.exports = FileTransfer;
