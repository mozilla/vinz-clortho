#!/bin/sh
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

set -e

progname=$(basename $0)

cd $(dirname $0)/..    # top level of the checkout

mkdir -p rpmbuild/SOURCES rpmbuild/SPECS rpmbuild/SOURCES
rm -rf rpmbuild/RPMS rpmbuild/SOURCES/mozillaidp

# make an archive out of the current code for the rpmbuild
# command to work with
tar --exclude rpmbuild \
    --exclude .git \
    --exclude var -czf \
    "$PWD/rpmbuild/SOURCES/mozilla-idp-server.tar.gz" .

set +e

export GIT_REVISION=$(git log -1 --oneline)

rpmbuild --define "_topdir $PWD/rpmbuild" \
         -ba scripts/mozidp.spec
rc=$?
if [ $rc -eq 0 ]; then
    ls -l $PWD/rpmbuild/RPMS/*/*.rpm
else
    echo "$progname: failed to build MozillaIDP RPM (rpmbuild rc=$rc)" >&2
fi

exit $rc

