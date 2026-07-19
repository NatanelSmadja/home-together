-- רק אחרי שיצרת את שני המשתמשים ב-Authentication > Users.
-- החלף את כתובות האימייל בכתובות האמיתיות שלכם והריץ פעם אחת.
do $$
declare
  family_id uuid;
  user_one uuid;
  user_two uuid;
begin
  select id into user_one from auth.users where email='YOUR_EMAIL@example.com';
  select id into user_two from auth.users where email='WIFE_EMAIL@example.com';
  if user_one is null or user_two is null then raise exception 'אחד המשתמשים לא נמצא'; end if;
  insert into public.households(name) values ('הבית שלנו') returning id into family_id;
  insert into public.profiles(id,full_name) values (user_one,'נתנאל'),(user_two,'נופר') on conflict(id) do nothing;
  insert into public.household_members(household_id,user_id,role) values (family_id,user_one,'owner'),(family_id,user_two,'owner');
end $$;
