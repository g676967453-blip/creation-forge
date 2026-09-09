# -*- coding: utf-8 -*-
"""生成救火英雄 H5 内网自签 HTTPS 证书（含本机 IP + localhost SAN）。
输出：<base>/certs/server.key 与 server.crt（不入库）。"""
import datetime
import ipaddress
import pathlib

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID

# 本机内网 IP（改这里或在命令行传）
DEFAULT_IP = "192.168.3.188"
# 输出到 server.js 根目录（IAA/certs）: tools 上三级 = IAA
OUT_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "certs"


def make_cert(ips):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "fire-hero-dev")])
    san = [x509.DNSName("localhost"), x509.IPAddress(ipaddress.ip_address(ips[0]))]
    cert = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.datetime.utcnow() - datetime.timedelta(days=1))
        .not_valid_after(datetime.datetime.utcnow() + datetime.timedelta(days=3650))
        .add_extension(x509.SubjectAlternativeName(san), critical=False)
        .sign(key, hashes.SHA256())
    )
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "server.key").write_bytes(
        key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.TraditionalOpenSSL,
            serialization.NoEncryption(),
        )
    )
    (OUT_DIR / "server.crt").write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    print("[OK] 证书已生成 ->", OUT_DIR)
    print("     SAN:", ", ".join(map(str, san)))


if __name__ == "__main__":
    import sys
    ips = sys.argv[1:] or [DEFAULT_IP]
    make_cert(ips)
