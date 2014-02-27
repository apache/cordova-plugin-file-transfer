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

Ce plugin vous permet de télécharger des fichiers.

## Installation

    cordova plugin add org.apache.cordova.file-transfer
    

## Plates-formes prises en charge

*   Amazon Fire OS
*   Android
*   BlackBerry 10 *
*   iOS
*   Windows Phone 7 et 8 *
*   Windows 8 *

* *Ne supportent pas `onprogress` ni `abort()` *

# Transfert de fichiers

Le `FileTransfer` objet fournit un moyen de télécharger des fichiers à l'aide d'une requête HTTP de la poste plusieurs partie et pour télécharger des fichiers aussi bien.

## Propriétés

*   **onprogress** : fonction appelée avec un `ProgressEvent` à chaque fois qu'un nouveau segment de données est transféré. *(Function)*

## Méthodes

*   **upload** : envoie un fichier à un serveur.

*   **download** : télécharge un fichier depuis un serveur.

*   **abort** : annule le transfert en cours.

## upload

**Paramètres**:

*   **filePath** : chemin d'accès complet au fichier sur l'appareil.

*   **server** : l'URL du serveur destiné à recevoir le fichier, encodée via `encodeURI()`.

*   **successCallback**: un callback passé à un objet `Metadata`. *(Fonction)*

*   **errorCallback** : callback d'erreur s'exécutant si une erreur survient lors de la récupération de l'objet `Metadata` . Appelée avec un objet `FileTransferError`. *(Function)*

*   **trustAllHosts** : paramètre facultatif, sa valeur par défaut est `false`. Si sa valeur est réglée à `true`, tous les certificats de sécurité sont acceptés. Ceci peut être utile car Android rejette les certificats auto-signés. N'est pas recommandé pour une utilisation en production. Supporté sous Android et iOS. *(boolean)*

*   **options**: paramètres facultatifs *(objet)*. Clés valides :
    
    *   **fileKey** : le nom de l'élément form. La valeur par défaut est `file`. (DOMString)
    *   **fileName** : le nom de fichier à utiliser pour l'enregistrement sur le serveur. La valeur par défaut est `image.jpg`. (DOMString)
    *   **mimeType** : le type mime des données à envoyer. La valeur par défaut est `image/jpeg`. (DOMString)
    *   **params** : un ensemble de paires clé/valeur facultative à passer dans la requête HTTP. (Objet)
    *   **chunkedMode** : s'il faut transmettre ou non les données en mode streaming de bloc. La valeur par défaut est `true`. (Boolean)
    *   **headers** : un objet représentant les noms et valeurs d'en-têtes à transmettre. Utiliser un tableau permet de spécifier plusieurs valeurs. (Objet)

### Exemple

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
    

### Exemple avec télécharger des en-têtes et des événements de progression (Android et iOS uniquement)

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

Un objet `FileUploadResult` est passé à la callback de succès de la méthode `upload()` de l'objet `FileTransfer`.

### Propriétés

*   **bytesSent** : le nombre d'octets envoyés au serveur dans le cadre du téléchargement. (long)

*   **responseCode** : le code de réponse HTTP retourné par le serveur. (long)

*   **response** : la réponse HTTP renvoyée par le serveur. (DOMString)

### iOS Quirks

*   Ne prend pas en charge les propriétés `responseCode` et `bytesSent`.

## download

**Paramètres**:

*   **source** : l'URL du serveur depuis lequel télécharger le fichier, encodée via `encodeURI()`.

*   **target** : chemin d'accès complet au fichier sur l'appareil.

*   **successCallback** : une callback de succès à laquelle est passée un objet `FileEntry`. *(Function)*

*   **errorCallback** : une callback d'erreur s'exécutant si une erreur se produit lors de la récupération de l'objet `Metadata`. Appelée avec un objet `FileTransferError`. *(Function)*

*   **trustAllHosts**: paramètre facultatif, valeur par défaut est `false` . Si la valeur `true` , il accepte tous les certificats de sécurité. Ceci est utile parce que Android rejette des certificats auto-signés. Non recommandé pour une utilisation de production. Supporté sur Android et iOS. *(boolean)*

*   **options** : paramètres facultatifs, seules les en-têtes sont actuellement supportées (par exemple l'autorisation (authentification basique), etc.).

### Exemple

    // !! Suppose que filePath est un chemin valide sur l'appareil
    
    var fileTransfer = new FileTransfer();
    var uri = encodeURI("http://some.server.com/download.php");
    
    fileTransfer.download(
        uri,
        filePath,
        function(entry) {
            console.log("Téléchargement terminé : " + entry.fullPath);
        },
        function(error) {
            console.log("Source pour l'erreur de téléchargement : " + error.source);
            console.log("Destination pour l'erreur de téléchargement : " + error.target);
            console.log("Code de l'erreur de téléchargement : " + error.code);
        },
        false,
        {
            headers: {
                "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
            }
        }
    );
    

## abort

Abandonne un transfert en cours. Un objet FileTransferError avec un code d'erreur FileTransferError.ABORT_ERR est passé à la callback d'erreur onerror.

### Exemple

    // !! Suppose que la variable fileURI contient l'URI valide d'un fichier texte sur l'appareil
    
    var win = function(r) {
        console.log("Ne devrait pas être appelée.");
    }
    
    var fail = function(error) {
        // error.code == FileTransferError.ABORT_ERR
        alert("Une erreur est survenue : code = " + error.code);
        console.log("Source pour l'erreur de téléchargement : " + error.source);
        console.log("Destination pour l'erreur de téléchargement : " + error.target);
    }
    
    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName="myphoto.jpg";
    options.mimeType="image/jpeg";
    
    var ft = new FileTransfer();
    ft.upload(fileURI, encodeURI("http://some.server.com/upload.php"), win, fail, options);
    ft.abort();
    

## FileTransferError

Un objet `FileTransferError` est passé à une callback d'erreur lorsqu'une erreur survient.

### Propriétés

*   **code** : l'un des codes d'erreur prédéfinis énumérés ci-dessous. (Number)

*   **source** : l'URI de la source. (String)

*   **target**: l'URI de la destination. (String)

*   **http_status** : code d'état HTTP. Cet attribut n'est disponible que lorsqu'un code de réponse est fourni via la connexion HTTP. (Number)

### Constantes

*   `FileTransferError.FILE_NOT_FOUND_ERR`
*   `FileTransferError.INVALID_URL_ERR`
*   `FileTransferError.CONNECTION_ERR`
*   `FileTransferError.ABORT_ERR`