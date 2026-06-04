ALTER TABLE invitation_settings 
ADD COLUMN IF NOT EXISTS show_gallery BOOLEAN DEFAULT true;
ADD COLUMN show_navbar BOOLEAN DEFAULT true,
ADD COLUMN show_footer BOOLEAN DEFAULT true,
ADD COLUMN show_story BOOLEAN DEFAULT true,
ADD COLUMN show_kas_kenangan BOOLEAN DEFAULT false,
ADD COLUMN show_rsvp BOOLEAN DEFAULT true,
ADD COLUMN show_guestbook BOOLEAN DEFAULT true,
ADD COLUMN show_countdown BOOLEAN DEFAULT false,
ADD COLUMN show_gallery BOOLEAN DEFAULT false,
ADD COLUMN show_rundown BOOLEAN DEFAULT false,
ADD COLUMN show_guidelines BOOLEAN DEFAULT false,
ADD COLUMN show_dresscode BOOLEAN DEFAULT false,
ADD COLUMN show_map BOOLEAN DEFAULT false;