/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function () {
window.provision = function (user) {
  var cmpi = function (s1, s2) {
        if (! s1.toLowerCase) s1 = String(s1);
        if (! s2.toLowerCase) s2 = String(s2);
        return s1.toLowerCase() == s2.toLowerCase();
      },
      msg = "user is not authenticated as target user";

  // Note: we explicitly ignore persona suggested certificate duration
  // and issue short-lived certs.  Because re-provisioning is
  // user invisible, this allows us a means of remote session
  // termination in case of security breaches.
  navigator.id.beginProvisioning(function(email /* , cert_duration */) {
    if (!user) {
      navigator.id.raiseProvisioningFailure(msg);
    } else {
      if (cmpi(user, email)) {
      navigator.id.genKeyPair(function(pubkey) {
        $.ajax({
            url: window.location.href,
            data: JSON.stringify({
              pubkey: pubkey,
              "_csrf": $('[name=_csrf]').val()
            }),
            type: 'POST',
            headers: { "Content-Type": 'application/json' },
            dataType: 'json',
            success: function(r) {
              navigator.id.registerCertificate(r.cert);
            },
            error: function(r) {
              navigator.id.raiseProvisioningFailure(msg);
            }
          });
        });
      } else {
        navigator.id.raiseProvisioningFailure(msg);
      }
    }
  }); //beginProvisioning
};
})();
