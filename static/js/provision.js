/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function () {
  // Note: we explicitly ignore persona suggested certificate duration
  // and issue short-lived certs.  Because re-provisioning is
  // user invisible, this allows us a means of remote session
  // termination in case of security breaches.
  navigator.id.beginProvisioning(function(email /* , cert_duration */) {
    navigator.id.genKeyPair(function(pubkey) {
      $.ajax({
        url: '/api/provision',
        data: JSON.stringify({
          pubkey: pubkey,
          user: email,
          "_csrf": $('[name=_csrf]').val()
        }),
        type: 'POST',
        headers: { "Content-Type": 'application/json' },
        dataType: 'json',
        success: function(r) {
          navigator.id.registerCertificate(r.cert);
        },
        error: function(r) {
          navigator.id.raiseProvisioningFailure("could not provision user");
        }
      });
    });
  });
})();
