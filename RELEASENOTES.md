<!--
#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
# 
# http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#
-->
# Release Notes

### 0.3.2 (Sept 25, 2013)
* CB-4889 bumping&resetting version
* [windows8] commandProxy was moved
* CB-4889 updating core references
* CB-4889 renaming org.apache.cordova.core.file-transfer to org.apache.cordova.file-transfer and updating dependency
* Rename CHANGELOG.md -> RELEASENOTES.md

### 0.3.3 (Oct 9, 2013)
* removed un-needed undef check
* Fix missing headers in Windows 8 upload proxy
* Fix missing headers in Windows 8 Proxy
* Fix Windows 8 HTMLAnchorElement return host:80 which force Basic Auth Header to replace options Auth Header
* [CB-4915] Incremented plugin version on dev branch.

 ### 0.3.4 (Oct 28, 2013)
* CB-5128: added repo + issue tag to plugin.xml for file transfer plugin
* [CB-5010] Incremented plugin version on dev branch.

### 0.4.0 (Dec 4, 2013)
* CB-5466: Partial revert; we're not ready yet for FS urls
* add ubuntu platform
* CB-5466: Minor version bump
* CB-5466: Update FileTransfer plugin to accept filesystem urls
* Added amazon-fireos platform. Change to use amazon-fireos as the platform if the user agen string contains 'cordova-amazon-fireos'

### 0.4.1 (Feb 05, 2014)
* CB-5365 Remove unused exception var to prevent warnings?
* CB-2421 explicitly write the bytesSent,responseCode,result to the FileUploadResult pending release of cordova-plugin-file dependency, added some sanity checks for callbacks
* iOS: Update for new file plugin api
* CB-5631 Removed SimpleTrackingInputStream.read(byte[] buffer)
* CB-5762 android: Fix lengthComputable set wrong for gzip downloads
* CB-4899 [BlackBerry10] Improve binary file transfer download
* Delete stale test/ directory
* CB-5722 [BlackBerry10] Update upload function to use native file object
* CB-5658 Delete stale snapshot of plugin docs
* Remove @1 designation from file plugin dependency until pushed to npm
* CB-5466: Update to work with filesystem URLs
