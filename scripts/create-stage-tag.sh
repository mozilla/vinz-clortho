#!/bin/sh

# 
# so all of our tags are in a consistent naming format
#
git tag "stage.$(date '+%Y_%m_%d.%H.%M.%S')"
