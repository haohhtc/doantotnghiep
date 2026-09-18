-- V31: Bo UNIQUE tren active_session.token_hash - phat hien qua test that: JWT claims (iat/exp)
-- chi chinh xac toi giay, nen 2 lan dang nhap trong CUNG 1 giay (vd double-click, nhieu tab) sinh
-- ra JWT giong het nhau -> trung token_hash -> vi pham UNIQUE -> loi lan sang ca transaction dang
-- nhap chinh ("Transaction silently rolled back"), chan dang nhap that. Khong can UNIQUE o day:
-- existsByTokenHashAndRevokedTrue() van dung dung ke ca khi trung hash (truong hop cuc hiem).

ALTER TABLE active_session DROP INDEX token_hash;
