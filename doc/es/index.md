<!---
    Licensed to the Apache Software Foundation (ASF) under one
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
-->

# org.apache.cordova.file-transfer

Este plugin te permite cargar y descargar archivos.

## Instalación

    cordova plugin add org.apache.cordova.file-transfer
    

## Plataformas soportadas

*   Amazon fuego OS
*   Android
*   BlackBerry 10 *
*   iOS
*   Windows Phone 7 y 8 *
*   Windows 8 *

* *No son compatibles con `onprogress` ni `abort()` *

# File Transfer

El `FileTransfer` objeto proporciona una manera de subir archivos mediante una solicitud HTTP de POST varias parte y para descargar archivos.

## Propiedades

*   **OnProgress**: llama con un `ProgressEvent` cuando se transfiere un nuevo paquete de datos. *(Función)*

## Métodos

*   **cargar**: envía un archivo a un servidor.

*   **Descargar**: descarga un archivo del servidor.

*   **abortar**: aborta una transferencia en curso.

## subir

**Parámetros**:

*   **ruta**: ruta de acceso completa del archivo en el dispositivo.

*   **servidor**: dirección URL del servidor para recibir el archivo, como codificada por`encodeURI()`.

*   **successCallback**: una devolución de llamada que se pasa un `Metadata` objeto. *(Función)*

*   **errorCallback**: una devolución de llamada que se ejecuta si se produce un error recuperar la `Metadata` . Invocado con un `FileTransferError` objeto. *(Función)*

*   **trustAllHosts**: parámetro opcional, por defecto es `false` . Si establece en `true` , acepta todos los certificados de seguridad. Esto es útil ya que Android rechaza certificados autofirmados seguridad. No se recomienda para uso productivo. Compatible con iOS y Android. *(boolean)*

*   **Opciones**: parámetros opcionales *(objeto)*. Teclas válidas:
    
    *   **fileKey**: el nombre del elemento de formulario. Por defecto es `file` . (DOMString)
    *   **nombre de archivo**: el nombre del archivo a utilizar al guardar el archivo en el servidor. Por defecto es `image.jpg` . (DOMString)
    *   **mimeType**: el tipo mime de los datos para cargar. Por defecto es `image/jpeg` . (DOMString)
    *   **params**: un conjunto de pares clave/valor opcional para pasar en la petición HTTP. (Objeto)
    *   **chunkedMode**: Si desea cargar los datos en modo de transmisión fragmentado. Por defecto es `true` . (Boolean)
    *   **cabeceras**: un mapa de valores de encabezado nombre/cabecera. Utilice una matriz para especificar más de un valor. (Objeto)

### Ejemplo

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
    

### Ejemplo con cabeceras de subir y eventos de progreso (Android y iOS solamente)

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
    ft.onprogress = function(progressEvent) {
        if (progressEvent.lengthComputable) {
          loadingStatus.setPercentage(progressEvent.loaded / progressEvent.total);
        } else {
          loadingStatus.increment();
        }
    };
    ft.upload(fileURI, uri, win, fail, options);
    

## FileUploadResult

A `FileUploadResult` objeto se pasa a la devolución del éxito de la `FileTransfer` del objeto `upload()` método.

### Propiedades

*   **bytesSent**: el número de bytes enviados al servidor como parte de la carga. (largo)

*   **responseCode**: código de respuesta HTTP el devuelto por el servidor. (largo)

*   **respuesta**: respuesta el HTTP devuelto por el servidor. (DOMString)

### iOS rarezas

*   No es compatible con `responseCode` o`bytesSent`.

## descargar

**Parámetros**:

*   **fuente**: dirección URL del servidor para descargar el archivo, como codificada por`encodeURI()`.

*   **objetivo**: ruta de acceso completa del archivo en el dispositivo.

*   **successCallback**: una devolución de llamada que se pasa un `FileEntry` objeto. *(Función)*

*   **errorCallback**: una devolución de llamada que se ejecuta si se produce un error al recuperar los `Metadata` . Invocado con un `FileTransferError` objeto. *(Función)*

*   **trustAllHosts**: parámetro opcional, por defecto es `false` . Si establece en `true` , acepta todos los certificados de seguridad. Esto es útil porque Android rechaza certificados autofirmados seguridad. No se recomienda para uso productivo. Compatible con iOS y Android. *(boolean)*

*   **Opciones**: parámetros opcionales, actualmente sólo soporta cabeceras (como autorización (autenticación básica), etc.).

### Ejemplo

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
    

## abortar

Aborta a una transferencia en curso. El callback onerror se pasa un objeto FileTransferError que tiene un código de error de FileTransferError.ABORT_ERR.

### Ejemplo

    // !! Assumes variable fileURI contains a valid URI to a text file on the device
    
    var win = function(r) {
        console.log("Should not be called.");
    }
    
    var fail = function(error) {
        // error.code == FileTransferError.ABORT_ERR
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    }
    
    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName="myphoto.jpg";
    options.mimeType="image/jpeg";
    
    var ft = new FileTransfer();
    ft.upload(fileURI, encodeURI("http://some.server.com/upload.php"), win, fail, options);
    ft.abort();
    

## FileTransferError

A `FileTransferError` objeto se pasa a un callback de error cuando se produce un error.

### Propiedades

*   **código**: uno de los códigos de error predefinido enumerados a continuación. (Número)

*   **fuente**: URI a la fuente. (String)

*   **objetivo**: URI a la meta. (String)

*   **HTTP_STATUS**: código de estado HTTP. Este atributo sólo está disponible cuando se recibe un código de respuesta de la conexión HTTP. (Número)

### Constantes

*   `FileTransferError.FILE_NOT_FOUND_ERR`
*   `FileTransferError.INVALID_URL_ERR`
*   `FileTransferError.CONNECTION_ERR`
*   `FileTransferError.ABORT_ERR`