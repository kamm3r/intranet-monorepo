export const fullName = (email) => {
  if (!email) return;
  const _name = email.split("@")[0];
  const name = _name.replace(/[0-9]/g, "");
  if (!name.includes(".")) return name;
  const names = name.split(".");
  const firstname = names[0].charAt(0).toUpperCase() + names[0].slice(1);
  const lastname = names[names.length - 1].charAt(0).toUpperCase() + names[names.length - 1].slice(1);
  return firstname + " " + lastname;
};

export const getHHMMSS = (time = new Date()) => {
  const hours = time.getHours() < 10 ? "0" + time.getHours() : time.getHours();
  const minutes = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
  const seconds = time.getSeconds() < 10 ? "0" + time.getSeconds() : time.getSeconds();
  return hours + ":" + minutes + ":" + seconds;
};

export const getHHMM = (time) => {
  const hours = time.getHours() < 10 ? "0" + time.getHours() : time.getHours();
  const minutes = time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes();
  return hours + ":" + minutes;
};

export const getDate = (date) => {
  const year = date.getFullYear().toString();
  const month = date.getMonth() < 10 ? "0" + date.getMonth() : date.getMonth();
  const day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
  return year + "-" + month + "-" + day;
};
