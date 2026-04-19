-- Migration 010: Seed full member list from ACS Realm export
-- Source: docs/FromBonnie/ACS - Copy.csv (83 members)
-- Replaces the 3-member test seed from Sprint 0

begin;

-- Clear test seed data
delete from public.members;

-- Insert all ACS members
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('11', 'Vanessa Aiken & Evan Canova', '218 Park Ave, East Orange, NJ, 07017-4406', null, null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('13', 'Barbara Alper', '22 Rosewood Ter, Bloomfield, NJ, 07003-3607', null, null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('4', 'Theresa & Michael Anazodo', '31 Lexington Ave, Bloomfield, NJ, 07003-5715', 'mykezodos@yahoo.com', '(973) 748-7435', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('2', 'F. Anderson', '62 N Willow St, Montclair, NJ, 07042-3845', null, null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('6', 'Ellen Anello', '19 Woodland Ave, Glen Ridge, NJ, 07028-1230', 'sociel@comcast.net', '(973) 748-7418', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('9', 'Ms. Cordelia Banks', '270 Bloomfield Ave Apt C2, Bloomfield, NJ, 07003-4870', 'cordeliabanks@gmail.com', '(973) 743-3270', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('8', 'Cornelia Banks', '270 Bloomfield Ave Apt C2, Bloomfield, NJ, 07003-4870', 'banks.cornelia@yahoo.com', '(973) 743-3270', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('10', 'Mrs. Gwenda Barnes', '118 Claremont Ave, Montclair, NJ, 07042-3706', 'mategb@aol.com', '(973) 783-9606', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('85', 'Jewell Campbell & Yvette Sosa', '730 Linden Blvd., Apt 2B, Brooklyn, NY, 11203', 'bellteacher1@gmail.com', '(347) 651-5218', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('36', 'Krislyn Chalmers', '67 Commonwealth Ave, Newark, NJ, 07106-3028', 'okchalmers@gmail.com', '(973) 380-3055', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('88', 'Linda & Roly Cortes', '375 Orange Rd, Montclair, NJ, 07042-4326', 'rcortz@aol.com', '(973) 746-5897', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('65', 'Amy Davis & Dan Walker', '65 Willow St, Glen Ridge, NJ, 07028-1013', 'amydavis222@gmail.com', '(973) 748-5067', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('15', 'Sophia Donarumo', null, 'sdunarumo@hotmail.com', '(973) 699-3703', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('16', 'David Drislane & Leo Toledo', '179 Thomas St, Bloomfield, NJ, 07003-2504', 'irish2guy@hotmail.com', '(973) 748-4548', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('86', 'Daniel Dunkley', '11 Ridgewood Ave, Glen Ridge, NJ, 07028-1019', 'mrsdld@comcast.net', '(973) 743-3894', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('14', 'Judith & Ddoyd Dunkley', '11 Ridgewood Ave, Glen Ridge, NJ, 07028-1019', 'mrsdld@comcast.net', '(973) 743-3894', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('19', 'Jane Durham', '33 Essex Ave, Bloomfield, NJ, 07003-2709', 'jjdurham@verizon.net', '(973) 748-3753', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('90', 'Brigid Dwyer', '108 Orange St Apt 9, Bloomfield, NJ, 07003-4756', 'dwyerbx@yahoo.com', '(619) 994-5283', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('20', 'Nancy Fairty', '358 Watchung Ave, Bloomfield, NJ, 07003-4321', 'nancylfairty@msn.com', '(973) 634-2027', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('23', 'Keandre Farquharson', '11 Cedar St, Bloomfield, NJ, 07003-4919', 'Keandre483@gmail.com', '(862) 621-5751', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('22', 'Keshawn Farquharson', '11 Cedar St, Bloomfield, NJ, 07003-4919', 'kekefarquharson@gmail.com', '(973) 941-9526', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('21', 'Shirley Farquharson', '11 Cedar St, Bloomfield, NJ, 07003-4919', 'sfarquharson2628@gmail.com', '(973) 873-0739', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('42', 'Kathleen & Russel Fay', '64 Smull Ave, Caldwell, NJ, 07006-5005', 'russ.g.fay@gmail.com', '(973) 432-7403', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('80', 'Lia Fiol-Matta', '6 Lincoln St, Bloomfield, NJ, 07003-6019', 'lfmesq@gmail.com', '(973) 619-2004', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('18', 'Aubrey George', '19 Irwin Pl, Bloomfield, NJ, 07003-3020', 'aubrieemmons@gmail.com', null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('26', 'Lambert Gibson', '47 Branch Brook Pl Apt 3K, Newark, NJ, 07104-1744', 'golamda63@hotmail.com', '(973) 405-1009', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('45', 'Melicia & Burkett Goulbourne', '357 Berryman Pl, Orange, NJ, 07050-1906', null, '(973) 678-7721', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('27', 'Orett Goulbourne', '19 Valley Way, West Orange, NJ, 07052-5807', null, null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('97', 'Linda Grier', '68-70 Park Avenue, Bloomfield, NJ, 7003', 'lindagrier2017@gmail.com', '(973) 323-7227', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('48', 'Bonnie Gustafsson', '32 Fremont St Apt 4, Bloomfield, NJ, 07003-3487', 'swedie@comcast.net', '(973) 680-1477', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('76', 'Larry Hayes', '2516 Fairhill Dr, Cincinnati, OH, 45239-7205', null, null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('28', 'Eleanor & Elmer Hill', '194 Thomas St, Glen Ridge, NJ, 07028-2215', null, '(973) 743-8831', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('49', 'Eugene & Karen Hucks', '126 Beverly Rd, Bloomfield, NJ, 07003-4164', 'eugene.hucks1@gmail.com', null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('29', 'Iona Hutchinson', '41 Prospect Ter, East Orange, NJ, 07017-2404', 'ionaehutchinson@yahoo.com', '(973) 672-4350', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('74', 'Dwight & Gail Jackson', '530 Valley Rd Apt 2L, Upper Montclair, NJ, 07043-2741', 'Gail.moaney@FinnPartners.com', '(646) 247-1274', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('53', 'Jeicol Herrera & Jessica Johnson', '569 Morris St, Orange, NJ, 07050-1116', 'jlynnjohnson91@gmail.com', '(862) 354-3152', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('54', 'Melinda Johnson', '522 North Arlington Avenue, East Orange, NJ, 7017', null, null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('51', 'Barbara Kaplan', '13 Marcy St, Bloomfield, NJ, 07003-3814', null, null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('57', 'Greatha Lindo & Walter Kelsick', '51 Sawyer Ave, East Orange, NJ, 07017-5016', null, null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('61', 'Elizabeth (Betty) Kish & Ann Watson', '2505 Walnut Dr, Stroudsburg, PA, 18360-8720', 'emk56@msn.com', '(973) 900-1122', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('81', 'Jeffrey Kist', '65 Hoover Ave, Bloomfield, NJ, 07003-5227', null, null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('32', 'Richard Lamb', '6 Horizon Rd Apt 601, Fort Lee, NJ, 07024-6606', 'ralambnew@gmail.com', '(201) 224-5474', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('34', 'Betty Leake', '340 Orange Rd Apt 208, Montclair, NJ, 07042-4352', null, '(973) 655-0546', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('63', 'Robin Lucas', '13 Budapest St, Monroe Township, NJ, 08831-8676', null, null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('39', 'Johnelle Mannie', '270 Bloomfield Ave Apt C2, Bloomfield, NJ, 07003-4870', 'banks.cornelia@yahoo.com', '(973) 743-3270', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('40', 'Maria Marin', '50 Watsessing Ave Unit A7, Belleville, NJ, 07109-1289', 'marimar47@gmail.com', null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('41', 'Denise Massay-Williams', '41 Prospect Ter, East Orange, NJ, 07017-2404', 'denisemassay@gmail.com', '(973) 414-9541', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('67', 'Kelly & Amy McAllister', '47 Carteret St, Bloomfield, NJ, 07003-2225', 'kellywmcallister@gmail.com', '(973) 494-4851', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('68', 'Josephine McGrail', '87 Laurel Ave, Bloomfield, NJ, 07003-2228', 'jodancer49@gmail.com', '(201) 600-1325', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('44', 'Leamon & Patrine McKenzie', '78 Willet St, Bloomfield, NJ, 07003-5130', 'leemckenzie23@gmail.com', '(862) 202-9783', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('89', 'Leamon McKenzie, Jr.', '78 Willet St, Bloomfield, NJ, 07003-5130', 'ljmckenzie11@gmail.com', '(862) 202-9783', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('46', 'Clara & Curtis Mitchell', '114 Hillside Ave, Glen Ridge, NJ, 07028-2219', 'clarapples114@gmail.com', '(973) 743-3038', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('31', 'Elise Mitchell', '114 Hillside Ave, Glen Ridge, NJ, 07028-2219', 'clarapples114@gmail.com', '(973) 743-3038', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('33', 'Jeanelle Mitchell', '114 Hillside Ave, Glen Ridge, NJ, 07028-2219', 'clarapples114@gmail.com', '(973) 743-3038', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('47', 'Frances Myrill', '390 Franklin St Apt 404, Bloomfield, NJ, 07003-3669', null, '(973) 680-1122', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('69', 'Nkiruka Ndichie', null, null, '(973) 338-1730', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('91', 'Desiree Noel', 'PO Box 1983, Bloomfield, NJ, 07003-1983', 'd.noel463@gmail.com', '(917) 747-3449', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('72', 'John Oemer', '400 Hoover Ave Apt 201, Bloomfield, NJ, 07003-3759', null, '(845) 841-0249', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('83', 'Simone Plass', '700 Mill St Unit I9, Belleville, NJ, 07109-5303', null, '(973) 860-8437', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('73', 'Cheryl Restaino', '11 Allister Ct, Lincoln Park, NJ, 07035-1760', 'carsjm123@gmail.com', '(973) 493-9467', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('70', 'Amy & Tom Reynolds', '196 Watchung Ave., West Orange, NJ, 7052', 'amy.reynolds.nj@gmail.com', '(973) 518-1608', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('50', 'Stephanie & Ben Reynolds', '201 Watchung Avenue #13, Bloomfield, NJ, 7003', 'pts.reynolds@gmail.com', '(908) 477-7841', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('43', 'Michelle Ryndak', '128 Broad St Apt 33, Bloomfield, NJ, 07003-2632', 'micropho@aol.com', '(631) 245-3711', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('94', 'Faith Salaash', '410 Dodd St, East Orange, NJ, 07017-1211', 'salaash@excite.com', '(201) 926-8703', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('75', 'Josephine Schuster', '416 Broughton Ave, Bloomfield, NJ, 07003-4234', 'JOSCHUSTER@YAHOO.COM', null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('55', 'William Seeman', '86 Hillside Ave, Glen Ridge, NJ, 07028-2212', 'williamlseeman@comcast.net', '(973) 748-4709', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('56', 'Nadine Sempier', '2205 Walnut Drive, Stroudsburg, PA, 18360', 'Nadinesempier@outlook.com', '(973) 320-4117', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('87', 'Loretta Simon', '926 Bloomfield Ave Apt 4B, Glen Ridge, NJ, 07028-1331', 'lsim4425gr@gmail.com', '(518) 573-1151', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('58', 'Jeffrey Stanfill', '58 Lindsley Ave, West Orange, NJ, 07052-4822', 'jeff@voicesoaring.com', null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('84', 'Stephanie Stathan-Willoughby', '31 Woodland Ave, Glen Ridge, NJ, 07028-1230', null, null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('59', 'Leroy & Pansy Swan', '99 Hook Mountain Rd, Montville, NJ, 07045-9619', null, null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('77', 'Matthew & Megan Sweet', '33 Edgewood Rd, Bloomfield, NJ, 07003-2608', 'msweet555@gmail.com', '(201) 575-1715', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('52', 'Margaret Voorhees', '377 S Harrison St Apt 9E # Apr, East Orange, NJ, 07018-1263', null, null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('60', 'Emmanuel Wakhata', '323 Elizabeth St # 1, Orange, NJ, 07050-2810', 'emwak1786@yahoo.com', '(718) 637-1138', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('66', 'Vera Wallace', '169 Port Royal Dr, Toms River, NJ, 8757', null, '(973) 744-0007', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('62', 'Rhonda Watson', '202 Trebing Pl, Union, NJ, 07083-6713', 'rhonsmail@aol.com', '(908) 623-3116', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('99', 'Joan & Robert White', '32 Lincoln St, Glen Ridge, NJ, 07028-1205', 'rlgw@comcast.net', '(973) 748-7923', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('1', 'Rev. Diana Wilcox', '16 Pine Valley Rd, Fredon, NJ, 07860-5240', 'rector@christchurchepiscopal.org', '(973) 975-7589', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('82', 'Karen Williams', '37 Baldwin Pl, Bloomfield, NJ, 07003-6008', null, null, true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('78', 'Obiama Williams', '41 Prospect Ter Apt 3, East Orange, NJ, 07017-2445', 'obiwill31@gmail.com', '(973) 477-4933', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('38', 'Dan Wing & Yvette Lucas', '673 Ridgewood Ave, Upper Montclair, NJ, 07043-2413', 'dcwing08@verizon.net', '(973) 744-0217', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('64', 'Elizabeth Yarborough', '12 Brooklawn Rd, Montclair, NJ, 07042-4348', 'tomr.mba@gmail.com', '(973) 746-2760', true);
insert into public.members (giving_number, full_name, address, email, phone, is_active) values ('79', 'Eris Yarborough', '32 James St, Montclair, NJ, 07042-2914', null, '(973) 233-1162', true);

commit;
