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
mkdir -p rpmbuild/SOURCES rpmbuild/SPECS rpmbuild/SOURCES rpmbuild/BUILD
git clone . rpmbuild/BUILD
cd rpmbuild/BUILD
git checkout $VER
export GIT_REVISION=$(git log -1 --oneline)

cd $TOP

set +e

rpmbuild --define "_topdir $PWD/rpmbuild" \
         -ba scripts/mozidp.spec
rc=$?
if [ $rc -eq 0 ]; then
    ls -l $PWD/rpmbuild/RPMS/*/*.rpm
else
    echo "$progname: failed to build MozillaIDP RPM (rpmbuild rc=$rc)" >&2
fi

exit $rc

