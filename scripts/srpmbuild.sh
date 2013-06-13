#!/bin/sh
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

set -e

progname=$(basename $0)
TOP="$(cd $(dirname $0)/..; pwd)"    # top level of the checkout
cd $TOP

if [ $# -ne 1 ]; then
    echo "Usage: $(basename $0) (GIT_SHA | GIT_TAG | GIT_BRANCH)"
    exit 1
else
    VER=$1
fi

rm -rf rpmbuild
mkdir -p rpmbuild/SOURCES rpmbuild/SPECS rpmbuild/BUILD rpmbuild/TMP
git clone . rpmbuild/TMP &>/dev/null
cd rpmbuild/TMP
git checkout $VER &>/dev/null

export GIT_REVISION=$(git log -1 --oneline)
export GIT_HASH=$(echo $GIT_REVISION | cut -d ' ' -f1)
export MOZIDP_VER="$(echo $VER | sed 's/-/_/g').$GIT_HASH"

# build a tarball so we can create the source RPM correctly
tar --exclude .git \
    -czf "$TOP/rpmbuild/SOURCES/mozidp-$MOZIDP_VER.tar.gz" .

cd $TOP
set +e

# just build the source rpm 
# we will use mock to build the rpm

echo "Building Source RPM"

rpmbuild --define "_topdir $PWD/rpmbuild" \
         --define "version $MOZIDP_VER" \
         -bs scripts/mozidp.spec
