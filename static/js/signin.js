/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

$(document).ready(function() {
  // XXX: currently the server is plucking email out of get data when
  // the auth page is rendered.  It does this to render to the user
  // their substituted email address.
  //
  // We need the client to bounce the email off the server and sub it in.
  navigator.id.beginAuthentication(function(email) {
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
