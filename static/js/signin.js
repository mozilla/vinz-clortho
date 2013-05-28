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
        showTooltip("Yikes, Passwords have to be at least 6 characters",
            "#pass");
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
          showTooltip("The account cannot be logged in with this username and password", "#user");
        }
      });
    });
  });

  // From here below is tooltip code

  var ANIMATION_TIME = 250,
      TOOLTIP_MIN_DISPLAY = 2000,
      TOOLTIP_OFFSET_TOP_PX = 5,
      TOOLTIP_OFFSET_LEFT_PX = 10,
      READ_WPM = 200,
      hideTimer;

  function showTooltip(msg, anchor) {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }

    $(".tooltip").hide();
    $(".tooltip .contents").text(msg);
    $(".tooltip").fadeIn(ANIMATION_TIME);

    anchorTooltip(".tooltip", anchor);

    var displayTimeMS = calculateDisplayTime(msg);

    hideTimeout = setTimeout(function() {
      hideTimeout = null;
      $(".tooltip").fadeOut(ANIMATION_TIME);
    }, displayTimeMS);
  }

  function anchorTooltip(tooltip, anchor) {
    tooltip = $(tooltip);
    anchor = $(anchor);
    var tooltipOffset = anchor.offset();
    tooltipOffset.top -= (tooltip.outerHeight() + TOOLTIP_OFFSET_TOP_PX);
    tooltipOffset.left += TOOLTIP_OFFSET_LEFT_PX;

    tooltip.css(tooltipOffset);
  }

  function calculateDisplayTime(text) {
    // Calculate the amount of time a tooltip should display based on the
    // number of words in the content divided by the number of words an average
    // person can read per minute.
    var contents = text.replace(/\s+/, ' ').trim(),
        words = contents.split(' ').length,
        // The average person can read ± 250 wpm.
        wordTimeMS = (words / READ_WPM) * 60 * 1000,
        displayTimeMS = Math.max(wordTimeMS, TOOLTIP_MIN_DISPLAY);

        return displayTimeMS;
  }



});
