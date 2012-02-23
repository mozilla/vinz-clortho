$(document).ready(function() {
  navigator.id.beginAuthentication(function(email) {
    var cmpi = function (s1, s2) {
          if (! s1.toLowerCase) s1 = String(s1);
          if (! s2.toLowerCase) s2 = String(s2);
          return s1.toLowerCase() == s2.toLowerCase();
        },
        msg;
    // Email form element is actually ignored
    email = email.replace('dev.clortho.mozilla.org', 'mozilla.com');
    if (email) {
      // Sign-in used normally via BrowserID flow
      // Disable input as user should only use the email address
      // they specified.
      // We *don't* disable this if sign-in is being used directly
      // (outside of BrowserID), so user can edit the field
      $("input[type=email]").val(email).attr('disabled', true);
    }
    //all cancel buttons work the same
    $("form button.cancel").click(function(e) {
      e.preventDefault();
      msg = "user canceled authentication";
      navigator.id.raiseAuthenticationFailure(msg);
    });

    $("form").submit(function(e) {
      e.preventDefault();

      // figure out which password field they entered their password into
      var pass = $.trim($("#pass").val());

      // validate password client side
      if (pass.length < 6) {
        $("div.error").hide().text("Yikes, Passwords have to be at least 6 characters").fadeIn(600);
        return;
      }

      // Sign-in used directly, outside of BrowserID flow
      if (! email)
        email = $('[name=user]').val();
      $.ajax({
        url: '/browserid/sign_in',
        type: 'POST',
        dataType: 'json',
        data: { user: email, pass: pass },
        success: function() {
          // User is authenticated!  Let's call .completeAuthentication() and send
          // them on their way
          console.log("Calling completeAuthentication")
          navigator.id.completeAuthentication();
        },
        error: function() {
          // This is a terrible password.
          console.log("Bad password")
          $("div.error").hide().text("Yikes, that password looks wrong.  Try again.").fadeIn(600);
        }
      });
    });
  });
});
