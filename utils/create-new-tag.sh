#!/bin/sh

# 
# so all of our tags are in a consistent naming format
#
git tag "train.$(date '+%Y-%m-%d.%H.%M.%S')"
