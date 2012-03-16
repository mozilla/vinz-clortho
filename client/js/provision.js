(function () {
window.provision = function (user) {
  var cmpi = function (s1, s2) {
        if (! s1.toLowerCase) s1 = String(s1);
        if (! s2.toLowerCase) s2 = String(s2);
        return s1.toLowerCase() == s2.toLowerCase();
      },
      msg = "user is not authenticated as target user";
  console.log('hooking up begin provisioning with user=' + user);

  // username@dev.clortho.mozilla.org
  navigator.id.beginProvisioning(function(email, cert_duration) {
    console.log('callback');
    console.log('begining provisioning ' + email + ' ' + cert_duration);

    if (! user) {
      console.log('no session, failing');
      navigator.id.raiseProvisioningFailure(msg);
    } else {
      if (cmpi(user, email)) {
      console.log('emails matched ' + user + ' == ' + email + ' next genKeyPair');
      navigator.id.genKeyPair(function(pubkey) {
        $.ajax({
            url: '/browserid/provision',
            data: JSON.stringify({
              pubkey: pubkey,
              duration: cert_duration,
              "_csrf": $('[name=_csrf]').val()
            }),
            type: 'POST',
            headers: { "Content-Type": 'application/json' },
            dataType: 'json',
            success: function(r) {
              console.log("We successfully authed, registering cert");
              // all done!  woo!
              navigator.id.registerCertificate(r.cert);
            },
            error: function(r) {
              console.log("Error certifying key, raising provision failure");
              navigator.id.raiseProvisioningFailure(msg);
            }
          });
        });
      } else {
        console.log('User [', user, '] and email [', email, '] dont match');
        navigator.id.raiseProvisioningFailure(msg);
      }
    }
  }); //beginProvisioning
};
})();