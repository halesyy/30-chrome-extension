console.log("[JACKHALES] Hello, World!");

chrome.notifications.getPermissionLevel((result) => {
  console.log(`[JACKHALES] Permission level notifs:`);
  console.log(result);
});

var modalOpen = false;

$(document).ready((event) => {

  var cd = new Date();
  var currentTime = cd.getHours() + (cd.getMinutes() / 60);
  // currentTime = 0;
  // currentTime = 2;
  console.log(`Time: ${currentTime}`);

  chrome.storage.sync.get({currentTime: 0}, (result) => {
    const ct = result.currentTime;
    // at end, set currentTime to currentTime
    // checking to see if we need to delete
    console.log(`Stored CT is: ${ct}`);
    if (currentTime < ct) {
      // reset
      console.log(`local ct: ${currentTime} < ct (${ct}), resetting!`);
      chrome.storage.sync.set({times: {}}, (result) => { console.log(result); });
    }
    // updating
    chrome.storage.sync.set({currentTime: currentTime}, (result) => { console.log(result); })
  });


  /*
   * Frontloading.
   */
  var currentDT = 0;
  $('.half-hour').each((index, elem) => {
    var hr = $(elem);
    hr.attr("data-time", currentDT);
    hr.children().attr("data-time", currentDT);
    hr.addClass("bounceInDown animated");
    // check if it's less than currentTime
    if (currentDT <= currentTime) {
      hr.addClass("time-over");
      // hr.css({background: "black", color: "#525252"});
    }
    currentDT += 0.5;
  });

  // now, to load in all of the messages!
  refreshView();

});

function refreshView() {
  chrome.storage.sync.get({times: {}}, (result) => {
    // yea, i got a big brain
    const times = result.times;
    for (var i = 0; i <= 23.5; i = i + 0.5) {
      if (i in times) {
        $(`.half-hour[data-time="${i}"]`).find('h2').html(times[i].eventName);
        $(`.half-hour[data-time="${i}"]`).attr('title', times[i].description);
      }
    }
  });
}


setTimeout(function(){
  $('.half-hour').each((index, elem) => {
    var hr = $(elem);
    hr.removeClass("bounceInDown animated");
  });
}, 800);

$(document).on("click", ".mini-select", (event) => {
  const $this = $(event.target);
  const toPlace = $this.html();
  const placeTo = $($this.attr("data-to"));
  placeTo.val(toPlace);
});

function toggleModal() {
  if (modalOpen) {
    $('.modal').css({opacity: "0", zIndex: -1});
    modalOpen = false;
    $('#description, #event').val('');
    // setTimeout(function(){
    // }, 1000);
  }
  else {
    $('.modal').css({opacity: "1", zIndex: 1});
    modalOpen = true;
  }
}

/*
 * @time
 * 6.5 = 6hr 30min, send 6:30am
 */
function presetModal(time) {
  console.log(`Setting the time into: '${time}' for futures saves.`);
  window.selectedTime = time;
  if (time >= 12) {
    var set = "pm";
    time -= 12;
  }
  else {
    var set = "am";
  }
  if (time == 0) time = 12;
  if (time == 0.5) time = 12.5;
  if (time % 1 == 0) { // has no decimal
    var view = `${time}:00${set}`;
  }
  else { // has a decimal, means half hour
    var view = `${time-0.5}:30${set}`;
  }
  // console.log(view);
  $('#event-time').html(view);
}

function convertToHoursMinutes(time) {
  if (time % 1 == 0.5) {
    // half hour
    var hour = Math.floor(time);
    var minutes = 30;
    return [hour, minutes];
  }
  else {
    return [Math.floor(time), 0];
  }
}

/*
 * Open the important saving modal.
 */
$(document).on("click", ".half-hour", async function(event){
  // get it
  const $this = $(event.target);
  const t = $this.attr("data-time");
  if (t === undefined) {
    // console.log("test test test");
    // console.log(event.target);
    const t = $this.parent().attr("data-time");
  }
  presetModal(t);
  // gotta load too lmao
  await loadFor(t);
  toggleModal();
})

async function loadFor(time) {
  // check in chrome.storage.sync.get({times: {}})
  await chrome.storage.sync.get({times: {}}, (result) => {
    const times = result.times;
    if (time in times) {
      // console.log("ive gotta do something");
      let selected = times[time];
      console.log(selected);
      var description = selected["description"],
          eventName = selected["eventName"];
      $('#event').val(eventName);
      $('#description').val(description);
    }
    else {
      // nothing to do really
    }
  });
}

$(document).on("click", ".close", toggleModal);

$('.save').click(set);

function set() {
  const description = $('#description').val();
  const eventName = $('#event').val();
  const time = window.selectedTime;
  const hoursMinutes = convertToHoursMinutes(time);
  const hours = hoursMinutes[0], minutes = hoursMinutes[1];
  console.log(`time: ${time}`);
  console.log(`dec: ${description}, name: ${eventName}`);
  chrome.storage.sync.get({times: {}}, (result) => {
    const times = result.times;
    times[time] = {
      description, eventName
    };
    console.log(times);
    chrome.storage.sync.set({times: times}, (result) => {
      console.log("Saved, results:");
      console.log(result);
      refreshView();
      toggleModal();
      // estabolishing what fkn time we want this to run
      const now = new Date();
      const year = now.getFullYear(),
            month = now.getMonth(),
            day = now.getDate();

      var timestamp = +new Date(year, month, day, hours, minutes);
      // timestamp = (+new Date()) + 5000;
      console.log(`Going to set alarm for: ${timestamp}`);
      const accessor = `notify:${time}`;

      // set into cache
      // timestamp += 1;
      chrome.alarms.create(accessor, {
        when: timestamp
      });
      console.log(`Set alarm for '${accessor}', run at ${timestamp}`);

      // random id

    })
  });
}

// listener
chrome.alarms.onAlarm.addListener(function(alarm) {
  console.log("alarm triggered!");
  const accessor = alarm.name;
  const time = accessor.split(":")[1];
  // console.log(accessor);
  // console.log(alarm);
    // if (alarm.name === '3AMyet') {
    //     // Whatever you want
    // }
  chrome.storage.sync.get({times: {}}, (result) => {
    if (time in result.times) {
      const data = result.times[time];
      const description = data.description;
      const eventName = data.eventName;
      chrome.notifications.create(Math.random().toString(), {
        type: "basic",
        iconUrl: "/icon.png",
        title: `It's time to do: ${eventName}`,
        message: description
      });
    }
  });
});
