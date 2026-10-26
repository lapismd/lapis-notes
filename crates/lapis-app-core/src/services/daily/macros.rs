use chrono::{Datelike, NaiveDate};

pub(super) const MONTHS: [&str; 12] = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
pub(super) const DAYS: [&str; 7] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

/// en-US Gregorian Intl macros for the captured UTC-midnight source boundary.
pub(super) fn render(date: NaiveDate, token: &str) -> Option<String> {
    let month = MONTHS[date.month0() as usize];
    let weekday = DAYS[date.weekday().num_days_from_monday() as usize];
    let year = if date.year() <= 0 {
        1 - date.year()
    } else {
        date.year()
    };
    let short = format!("{}/{}/{year}", date.month(), date.day());
    let medium = format!("{} {}, {year}", &month[..3], date.day());
    let full = format!("{month} {}, {year}", date.day());
    let huge = format!("{weekday}, {full}");
    let time = "12:00\u{202f}AM";
    let seconds = "12:00:00\u{202f}AM";
    Some(match token {
        "D" => short,
        "DD" => medium,
        "DDD" => full,
        "DDDD" => huge,
        "t" => time.into(),
        "tt" => seconds.into(),
        "ttt" | "tttt" => format!("{seconds} UTC"),
        "T" => "00:00".into(),
        "TT" => "00:00:00".into(),
        "TTT" | "TTTT" => "00:00:00 UTC".into(),
        "f" => format!("{short}, {time}"),
        "ff" => format!("{medium}, {time}"),
        "fff" => format!("{full} at {time} UTC"),
        "ffff" => format!("{huge} at {time} UTC"),
        "F" => format!("{short}, {seconds}"),
        "FF" => format!("{medium}, {seconds}"),
        "FFF" => format!("{full} at {seconds} UTC"),
        "FFFF" => format!("{huge} at {seconds} UTC"),
        _ => return None,
    })
}
