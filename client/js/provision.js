(function () {
// username@mozilla.com
window.provision = function (user) {
  var cmpi = function (s1, s2) {
        if (! s1.toLowerCase) s1 = String(s1);
        if (! s2.toLowerCase) s2 = String(s2);
        return s1.toLowerCase() == s2.toLowerCase();
      },
      msg;
  console.log('hooking up begin provisioning with user=', user);

  // username@dev.clortho.mozilla.org
  navigator.id.beginProvisioning(function(email, cert_duration) {
    console.log('callback');
    console.log('begining provisioning', email, cert_duration);
    var n_email = email.replace('dev.clortho.mozilla.org', 'mozilla.com');
    if (! user) {
      console.log('no session, failing');
      console.log(navigator.id.raiseProvisioningFailure);
      msg = "No Active Session";
      navigator.id.raiseProvisioningFailure(msg);
    } else {
      if (cmpi(user, n_email)) {
      console.log('emails matched', user, n_email, 'next genKeyPair');
      navigator.id.genKeyPair(function(pubkey) {
        $.ajax({
            url: '/browserid/provision',
            data: JSON.stringify({
              pubkey: pubkey,
              duration: cert_duration
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
              msg = "couldn't certify key";
              navigator.id.raiseProvisioningFailure(msg);
            }
          });
        });
      } else {
        msg = 'user is not authenticated as target user';
        console.log(msg);
        navigator.id.raiseProvisioningFailure(msg);
      }    
    }
  }); //beginProvisioning
};
console.log('window.provision=', window.provision);
})();