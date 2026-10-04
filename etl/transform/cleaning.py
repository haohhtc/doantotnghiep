def clean_source_rows(df, required_cols, allow_negative_quantity=False):
    """Xu ly du lieu thieu/trung truoc khi merge voi dimension.
    - Bo dong thieu khoa ngoai bat buoc (required_cols).
    - Bo dong trung hoan toan.
    - Bo dong so luong bang 0 (khong co giao dich that); am chi cho phep khi
      allow_negative_quantity=True (vd stock_transaction ADJUST giam ton la so am hop le).
    - Bo dong thanh tien am (loi nhap lieu) - khong ap dung cho stock_transaction (khong co amount).
    """
    before = len(df)
    df = df.dropna(subset=required_cols)
    df = df.drop_duplicates()
    if "quantity" in df.columns:
        df = df[df["quantity"] != 0] if allow_negative_quantity else df[df["quantity"] > 0]
    if "amount" in df.columns:
        df = df[df["amount"] >= 0]
    dropped = before - len(df)
    if dropped:
        print(f"  [clean] loai {dropped}/{before} dong (thieu khoa, trung, hoac so lieu khong hop le)")
    return df.reset_index(drop=True)
