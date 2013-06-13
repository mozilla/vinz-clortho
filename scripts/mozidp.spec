%define _rootdir /opt/mozilla-idp-server

Name:          mozilla-idp-server
Version:       0.2013.06.19
Release:       1%{?dist}
Summary:       Mozilla IdP Server
Packager:      Benson Wong <bwong@mozilla.com>
Group:         Development/Libraries
License:       MPL 2.0
URL:           https://github.com/mozilla/vinz-clortho
Source0:       %{name}.tar.gz
BuildRoot:     %{_tmppath}/%{name}-%{version}-%{release}-root
AutoReqProv:   no
Requires:      openssl, nodejs >= 0.8.24, gmp-devel
BuildRequires: gmp-devel, gcc-c++, git, make, npm, nodejs >= 0.8.24

%description
Mozilla IdP Server

%prep
%setup -q -c -n mozillaidp

%build
npm install
export PATH=$PWD/node_modules/.bin:$PATH
echo "$GIT_REVISION" > static/ver.txt

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}%{_rootdir}
for f in node_modules docs mock-ldap-server scripts server static tests utils *.json *.md; do
    cp -rp $f %{buildroot}%{_rootdir}/
done
mkdir -p %{buildroot}%{_rootdir}/config

%clean
rm -rf %{buildroot}

%files
%defattr(-,root,root,-)
%{_rootdir}
