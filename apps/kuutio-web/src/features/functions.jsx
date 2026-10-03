export const initTimes = () => {
  let times = [{ time: "07:30", data: null }];
  for (let i = 8; i < 18; i++) {
    if (i < 10) {
      times.push({ time: "0" + i + ":00", data: null });
      times.push({ time: "0" + i + ":30", data: null });
    } else {
      times.push({ time: i + ":00", data: null });
      times.push({ time: i + ":30", data: null });
    }
  }
  return times;
};

export const fullName = (email) => {
  if (!email) return;
  const _name = email.split("@")[0];
  const name = _name.replace(/[0-9]/g, "");
  const names = name.split(".");
  const firstname = names[0].charAt(0).toUpperCase() + names[0].slice(1);
  const lastname = names[names.length - 1].charAt(0).toUpperCase() + names[names.length - 1].slice(1);
  return firstname + " " + lastname;
};

export const getValueOf = (b) => {
  const times = b.time.split(":");
  const date = new Date(b.year, b.month, b.day, times[0], times[1]);
  return date.valueOf();
};
