-- Office / work locations: major Indian cities (state and UT capitals, metros and large tier-2 cities), so the
-- Admin Employees location filter and form offer real choices instead of the three seed cities.
-- Idempotent: a city already present (by name or city, case-insensitive) is skipped, so the existing
-- 'Bangalore', 'Delhi' and 'Pune' rows - and anything added by hand - are left untouched.

INSERT INTO locations (organization_id, name, city, state, country, timezone, is_active)
SELECT (SELECT id FROM organizations ORDER BY id LIMIT 1), v.city, v.city, v.state, 'India', 'Asia/Kolkata', TRUE
FROM (VALUES
    -- Andhra Pradesh
    ('Visakhapatnam', 'Andhra Pradesh'), ('Vijayawada', 'Andhra Pradesh'), ('Guntur', 'Andhra Pradesh'),
    ('Nellore', 'Andhra Pradesh'), ('Tirupati', 'Andhra Pradesh'), ('Kurnool', 'Andhra Pradesh'),
    ('Amaravati', 'Andhra Pradesh'),
    -- Arunachal Pradesh / Assam
    ('Itanagar', 'Arunachal Pradesh'),
    ('Guwahati', 'Assam'), ('Dibrugarh', 'Assam'), ('Silchar', 'Assam'),
    -- Bihar
    ('Patna', 'Bihar'), ('Gaya', 'Bihar'), ('Bhagalpur', 'Bihar'), ('Muzaffarpur', 'Bihar'),
    -- Chhattisgarh
    ('Raipur', 'Chhattisgarh'), ('Bhilai', 'Chhattisgarh'), ('Bilaspur', 'Chhattisgarh'),
    -- Goa
    ('Panaji', 'Goa'), ('Margao', 'Goa'), ('Vasco da Gama', 'Goa'),
    -- Gujarat
    ('Ahmedabad', 'Gujarat'), ('Surat', 'Gujarat'), ('Vadodara', 'Gujarat'), ('Rajkot', 'Gujarat'),
    ('Gandhinagar', 'Gujarat'), ('Bhavnagar', 'Gujarat'), ('Jamnagar', 'Gujarat'),
    -- Haryana
    ('Gurugram', 'Haryana'), ('Faridabad', 'Haryana'), ('Panipat', 'Haryana'), ('Ambala', 'Haryana'),
    ('Karnal', 'Haryana'), ('Hisar', 'Haryana'), ('Sonipat', 'Haryana'),
    -- Himachal Pradesh
    ('Shimla', 'Himachal Pradesh'), ('Dharamshala', 'Himachal Pradesh'), ('Solan', 'Himachal Pradesh'),
    -- Jharkhand
    ('Ranchi', 'Jharkhand'), ('Jamshedpur', 'Jharkhand'), ('Dhanbad', 'Jharkhand'), ('Bokaro', 'Jharkhand'),
    -- Karnataka
    ('Bangalore', 'Karnataka'), ('Mysuru', 'Karnataka'), ('Mangaluru', 'Karnataka'), ('Hubballi', 'Karnataka'),
    ('Belagavi', 'Karnataka'), ('Davanagere', 'Karnataka'),
    -- Kerala
    ('Thiruvananthapuram', 'Kerala'), ('Kochi', 'Kerala'), ('Kozhikode', 'Kerala'), ('Thrissur', 'Kerala'),
    ('Kollam', 'Kerala'),
    -- Madhya Pradesh
    ('Bhopal', 'Madhya Pradesh'), ('Indore', 'Madhya Pradesh'), ('Gwalior', 'Madhya Pradesh'),
    ('Jabalpur', 'Madhya Pradesh'), ('Ujjain', 'Madhya Pradesh'),
    -- Maharashtra
    ('Mumbai', 'Maharashtra'), ('Pune', 'Maharashtra'), ('Nagpur', 'Maharashtra'), ('Nashik', 'Maharashtra'),
    ('Thane', 'Maharashtra'), ('Navi Mumbai', 'Maharashtra'), ('Chhatrapati Sambhajinagar', 'Maharashtra'),
    ('Solapur', 'Maharashtra'), ('Kolhapur', 'Maharashtra'), ('Amravati', 'Maharashtra'),
    -- North East
    ('Imphal', 'Manipur'), ('Shillong', 'Meghalaya'), ('Aizawl', 'Mizoram'), ('Kohima', 'Nagaland'),
    ('Dimapur', 'Nagaland'), ('Gangtok', 'Sikkim'), ('Agartala', 'Tripura'),
    -- Odisha
    ('Bhubaneswar', 'Odisha'), ('Cuttack', 'Odisha'), ('Rourkela', 'Odisha'),
    -- Punjab
    ('Ludhiana', 'Punjab'), ('Amritsar', 'Punjab'), ('Jalandhar', 'Punjab'), ('Patiala', 'Punjab'),
    ('Mohali', 'Punjab'),
    -- Rajasthan
    ('Jaipur', 'Rajasthan'), ('Jodhpur', 'Rajasthan'), ('Udaipur', 'Rajasthan'), ('Kota', 'Rajasthan'),
    ('Ajmer', 'Rajasthan'), ('Bikaner', 'Rajasthan'),
    -- Tamil Nadu
    ('Chennai', 'Tamil Nadu'), ('Coimbatore', 'Tamil Nadu'), ('Madurai', 'Tamil Nadu'),
    ('Tiruchirappalli', 'Tamil Nadu'), ('Salem', 'Tamil Nadu'), ('Tirunelveli', 'Tamil Nadu'),
    ('Vellore', 'Tamil Nadu'), ('Hosur', 'Tamil Nadu'),
    -- Telangana
    ('Hyderabad', 'Telangana'), ('Warangal', 'Telangana'), ('Karimnagar', 'Telangana'),
    -- Uttar Pradesh
    ('Lucknow', 'Uttar Pradesh'), ('Kanpur', 'Uttar Pradesh'), ('Noida', 'Uttar Pradesh'),
    ('Greater Noida', 'Uttar Pradesh'), ('Ghaziabad', 'Uttar Pradesh'), ('Agra', 'Uttar Pradesh'),
    ('Varanasi', 'Uttar Pradesh'), ('Prayagraj', 'Uttar Pradesh'), ('Meerut', 'Uttar Pradesh'),
    ('Bareilly', 'Uttar Pradesh'), ('Aligarh', 'Uttar Pradesh'), ('Gorakhpur', 'Uttar Pradesh'),
    -- Uttarakhand
    ('Dehradun', 'Uttarakhand'), ('Haridwar', 'Uttarakhand'), ('Haldwani', 'Uttarakhand'),
    -- West Bengal
    ('Kolkata', 'West Bengal'), ('Howrah', 'West Bengal'), ('Durgapur', 'West Bengal'),
    ('Asansol', 'West Bengal'), ('Siliguri', 'West Bengal'),
    -- Union territories
    ('Delhi', 'Delhi'), ('Chandigarh', 'Chandigarh'), ('Puducherry', 'Puducherry'),
    ('Srinagar', 'Jammu and Kashmir'), ('Jammu', 'Jammu and Kashmir'), ('Leh', 'Ladakh'),
    ('Port Blair', 'Andaman and Nicobar Islands'), ('Daman', 'Dadra and Nagar Haveli and Daman and Diu'),
    ('Kavaratti', 'Lakshadweep')
) AS v(city, state)
WHERE EXISTS (SELECT 1 FROM organizations)
  AND NOT EXISTS (
      SELECT 1 FROM locations l
      WHERE LOWER(l.name) = LOWER(v.city) OR LOWER(COALESCE(l.city, '')) = LOWER(v.city)
  );
