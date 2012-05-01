/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

$(document).ready(function() {
  navigator.id.beginAuthentication(function(email) {
    // TODO remove cmpi
    var cmpi = function (s1, s2) {
          if (! s1.toLowerCase) s1 = String(s1);
          if (! s2.toLowerCase) s2 = String(s2);
          return s1.toLowerCase() == s2.toLowerCase();
        },
        msg;
    // Email form element is actually ignored
    // TODO: This is needed for test environments... but is ugly
    if (window.fixup_delegate_domain) {
      email = fixup_delegate_domain(email);
    }

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
      var pass = $.trim($("#pass").val()),
          auth_url = $('form').attr('action');

      // validate password client side
      if (pass.length < 6) {
        $("div.error").hide().text("Yikes, Passwords have to be at least 6 characters").fadeIn(600);
        return;
      }

      // Sign-in used directly, outside of BrowserID flow
      if (! email)
        email = $('[name=user]').val();
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
