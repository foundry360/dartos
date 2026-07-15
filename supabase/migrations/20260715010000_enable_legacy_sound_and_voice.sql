-- Enable audio for existing profiles created while sound/voice defaulted to false.
-- Product default is now on; new rows already get true via column defaults.
update public.profiles
set
  sound_enabled = true,
  voice_announcements_enabled = true
where sound_enabled = false
   or voice_announcements_enabled = false;
