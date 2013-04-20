/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

$(document).ready(function() {
  // XXX: currently the server is plucking email out of get data when
  // the auth page is rendered.
  // That violates our abstraction and will break in the native case or
  // when we change our internal mechanism for conveying user email address
  // to authentication page.  We should pass email up to the
  // server for rewriting from javascript instead of using server
  // rewriting.
  navigator.id.beginAuthentication(function(/* XXX: rely on me: email */) {
    var msg;

    // all cancel buttons work the same
    $("form button.cancel").click(function(e) {
      e.preventDefault();
      msg = "user canceled authentication";
      navigator.id.raiseAuthenticationFailure(msg);
    });

    $("form").submit(function(e) {
      e.preventDefault();

      var pass = $.trim($("#pass").val()),
          auth_url = $('form').attr('action');

      // validate password client side
      if (pass.length < 6) {
        $("div.error").hide().text("Yikes, Passwords have to be at least 6 characters").fadeIn(600);
        return;
      }

      // XXX (see comment above): Use the email that the server wrote into
      // the page
      var email = $('[name=user]').val();

      $.ajax({
        url: auth_url,
        type: 'POST',
        dataType: 'json',
        data: { user: email, pass: pass, "_csrf": $('[name=_csrf]').val() },
        success: function() {
          navigator.id.completeAuthentication();
        },
        error: function() {
          $("div.error").hide().text("Yikes, that password looks wrong.  Try again.").fadeIn(600);
        }
      });
    });
  });
});
