INSERT INTO public.feature_flags (key, label, description, category, is_enabled, coming_soon)
VALUES
 ('club_signup', 'Clubs & Academies', 'Public "I own a club or academy" entry point and club onboarding.', 'discovery', false, false),
 ('public_nav', 'Public Website Navigation', 'Master switch: show discovery links (Find a Coach, Marketplace, Events, Community) in the public website header.', 'discovery', true, false)
ON CONFLICT (key) DO NOTHING;

UPDATE public.feature_flags SET description = 'Coach assessments, development chart and player card timeline.', coming_soon = false WHERE key = 'assessments';