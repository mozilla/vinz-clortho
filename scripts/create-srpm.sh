#!/bin/sh
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

# About: 
# 
# This script generates a SRPM of the source + rpm spec file to be passed
# the mock RPM build tool. See: http://fedoraproject.org/wiki/Projects/Mock
# 

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
mkdir -p rpmbuild/SRPM rpmbuild/SOURCES rpmbuild/SPECS rpmbuild/BUILD rpmbuild/TMP
git fetch
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

# generate a new spec file with the version baked in
TMPFILE=$TOP/rpmbuild/SPECS/mozidp.spec
sed "s/__VERSION__/$MOZIDP_VER/g" scripts/mozidp.spec.template > $TMPFILE

echo "Building Source RPM"
mock --root epel-6-x86_64 \
    --buildsrpm \
    --spec $TMPFILE \
    --sources $TOP/rpmbuild/SOURCES

FILENAME=mozilla-idp-server-${MOZIDP_VER}-1.el6.src.rpm
SRPM_SOURCE=/var/lib/mock/epel-6-x86_64/result/$FILENAME

if [ ! -e  $SRPM_SOURCE ]; then
    echo "Failed building SRPM" >&2
    exit 1
fi

mv /var/lib/mock/epel-6-x86_64/result/$FILENAME $TOP/rpmbuild/SRPM/
echo "Wrote: $TOP/rpmbuild/SRPM/$FILENAME"
