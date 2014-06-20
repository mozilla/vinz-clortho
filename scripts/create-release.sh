# 
# so all of our tags are in a consistent naming format
#
#
# Make sure everything is clean
#

cd $(dirname $0)/../
BASE=$PWD

# Make sure there are no uncommited changes
# src: http://stackoverflow.com/a/3879077/445792
git update-index -q --ignore-submodules --refresh
err=0

# Disallow unstaged changes in the working tree
if ! git diff-files --quiet --ignore-submodules --
then
    echo >&2 "cannot $1: you have unstaged changes."
    git diff-files --name-status -r --ignore-submodules -- >&2
    err=1
fi

# Disallow uncommitted changes in the index
if ! git diff-index --cached --quiet HEAD --ignore-submodules --
then
    echo >&2 "cannot $1: your index contains uncommitted changes."
    git diff-index --cached --name-status -r --ignore-submodules HEAD -- >&2
    err=1
fi

if [ $err = 1 ]
then
    echo >&2 "Please commit or stash them."
    exit 1
fi

RDATE=$(date '+%Y_%m_%d.%H.%M.%S')
TAG="rel$RDATE"
LAST_RELEASE=$(git tag --list | grep ^rel | sort -r | head -1)

if [ ! -e $BASE/ChangeLog ]; then 
    touch $BASE/ChangeLog
fi

if [ -z "$LAST_RELEASE" ]; then
    echo "Error: No last release found." >&2
    exit 1
fi

if [ -z $(git log --pretty=format:%s "$LAST_RELEASE..HEAD") ]; then
    echo "Abort: No changes since $LAST_RELEASE" >&2
    exit 1
fi

TMPFILE=$(mktemp /tmp/idpchangelog.XXXXX)
echo "$TAG:" > $TMPFILE
echo >> $TMPFILE
git log --no-merges --pretty="  * %h %s" "$LAST_RELEASE..HEAD" >> $TMPFILE

echo >> $TMPFILE
cat $BASE/ChangeLog >> $TMPFILE
cat $TMPFILE
cat $TMPFILE > $BASE/ChangeLog
git add $BASE/ChangeLog
git commit -am "Create Release: $TAG"
git tag $TAG
