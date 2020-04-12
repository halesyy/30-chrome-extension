
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
