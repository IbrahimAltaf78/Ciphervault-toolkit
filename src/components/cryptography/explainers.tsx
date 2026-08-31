import type { ReactNode } from "react";
import type { CryptoToolId } from "@/lib/crypto";

/**
 * "How this works" content for each algorithm, kept beside the UI so the
 * modules in lib/ stay pure logic with no JSX dependency.
 */
export const CRYPTO_EXPLAINERS: Record<CryptoToolId, ReactNode> = {
  aes: (
    <>
      <p>
        AES is a substitution-permutation network. Each 16-byte block goes
        through 10, 12 or 14 rounds of byte substitution, row shifting, column
        mixing and a key addition — 10 rounds for a 128-bit key, 14 for 256.
        Every round depends on the whole block, so one changed input bit alters
        roughly half the output.
      </p>
      <p>
        Your password is not the key. It goes through PBKDF2-HMAC-SHA-256 with a
        random 16-byte salt, which both stretches it to full length and makes
        each guess expensive. The salt travels in the envelope, which is why the
        same password produces a different ciphertext every time.
      </p>
      <p>
        The mode matters more than the key size. <code>GCM</code> is
        authenticated: tampering is detected and decryption refuses.{" "}
        <code>CBC</code> gives confidentiality only — a modified ciphertext
        still decrypts, into different plaintext. <code>CTR</code> turns AES
        into a stream cipher, where reusing a counter with the same key destroys
        the security completely, so a fresh random counter is generated here for
        every message.
      </p>
    </>
  ),
  des: (
    <>
      <p>
        DES is a 16-round Feistel network over 64-bit blocks. Each round splits
        the block, runs one half through an expansion, a subkey mixing step,
        eight substitution boxes and a permutation, then swaps the halves. The
        elegance of a Feistel design is that decryption is the identical circuit
        with the subkeys applied in reverse.
      </p>
      <p>
        The S-boxes are the only non-linear component and the reason DES resists
        differential cryptanalysis as well as it does — NSA-supplied and
        unexplained at the time, they turned out to be strengthened against an
        attack the public literature would not describe for another 15 years.
      </p>
      <p>
        The key is where it fails. Of 64 bits, 8 are parity, leaving 56 — about
        72 quadrillion keys, which sounds large and is not. The EFF built{" "}
        <em>Deep Crack</em> for $250,000 in 1998 and recovered a key in 56 hours.
        Today it is a cloud invoice. This implementation exists so you can watch
        the mechanism, not to protect anything.
      </p>
    </>
  ),
  "3des": (
    <>
      <p>
        Triple DES answers the key-length problem without redesigning anything:
        run DES three times with three keys, in encrypt-decrypt-encrypt order.
        The middle decryption is not a mistake — with all three keys equal, 3DES
        collapses to single DES, which let it stay backward compatible with
        deployed hardware.
      </p>
      <p>
        Two encryptions would have been the obvious choice, but double
        encryption buys almost nothing: the meet-in-the-middle attack trades
        memory for time and breaks 2DES at roughly the cost of breaking single
        DES twice. Three passes give 112 bits of effective security against that
        attack rather than the 168 the key length suggests.
      </p>
      <p>
        What retired it was the block size, not the key. With 64-bit blocks a
        collision becomes likely after about 32 GB under one key — the Sweet32
        attack — which is an afternoon of HTTPS traffic. NIST disallowed it for
        new applications after 2023.
      </p>
    </>
  ),
  rsa: (
    <>
      <p>
        RSA rests on the gap between multiplying and factoring. Multiplying two
        large primes is instant; recovering them from the product is not, and no
        efficient classical algorithm is known. The public key is that product
        plus an exponent; the private key is derived from the primes themselves.
      </p>
      <p>
        Encryption is modular exponentiation, so the message must be a number
        smaller than the modulus. That is a hard ceiling: with OAEP over SHA-256,
        a 2048-bit key carries at most{" "}
        <code>256 - 2 &times; 32 - 2 = 190</code> bytes. Not a limitation to
        route around — it is the reason hybrid encryption exists.
      </p>
      <p>
        The padding is not optional. Textbook RSA is deterministic, so identical
        messages produce identical ciphertexts and short messages can simply be
        enumerated. OAEP adds randomness and structure, which is also why the
        same plaintext encrypts differently each time here.
      </p>
    </>
  ),
  ecc: (
    <>
      <p>
        Elliptic curve cryptography replaces the factoring problem with the
        discrete logarithm problem over a curve. The payoff is size: P-256 gives
        security comparable to RSA-3072 with keys an order of magnitude smaller,
        which is why it dominates TLS and every constrained device.
      </p>
      <p>
        ECC cannot encrypt. There is no curve equivalent of raising a message to
        an exponent — the primitive is a key agreement. So this tool does what
        every real system does, an ECIES construction: generate a throwaway key
        pair, ECDH it against the recipient public key to reach a shared secret,
        run that through HKDF to get a clean AES-256 key, and encrypt with
        AES-GCM. The ephemeral public key travels with the ciphertext.
      </p>
      <p>
        Because the ephemeral private key is generated per message and discarded
        immediately, it cannot be seized later. That property is forward
        secrecy, and it is why encrypting the same message twice here produces
        two completely different payloads.
      </p>
    </>
  ),
  sha256: (
    <>
      <p>
        SHA-2 compresses a message into a fixed digest through the
        Merkle-Damgard construction: pad the input, split it into blocks, and
        feed each block through a compression function along with the running
        state. SHA-256 uses 64 rounds over a 256-bit state.
      </p>
      <p>
        A digest is not encryption. There is no key and nothing to reverse — the
        function throws information away deliberately. What makes it useful is
        the avalanche property: changing one bit of input changes about half the
        output bits, unpredictably. Verifying means hashing again and comparing.
      </p>
      <p>
        The construction has one inherited quirk worth knowing: it is vulnerable
        to length extension. Given <code>H(secret + message)</code> and the
        length of the secret, an attacker can compute{" "}
        <code>H(secret + message + suffix)</code> without knowing the secret.
        That is why authentication uses HMAC rather than a bare digest.
      </p>
    </>
  ),
  sha3: (
    <>
      <p>
        SHA-3 is not an improved SHA-2 — it is a deliberately unrelated design.
        After collision attacks broke MD5 and then SHA-1, both
        Merkle-Damgard constructions, NIST ran an open competition for a
        replacement built on different foundations, so a future break in SHA-2
        would not take its successor with it. Keccak won in 2012.
      </p>
      <p>
        It works as a sponge. Input is absorbed into a large internal state a
        block at a time, with a fixed permutation applied between blocks, then
        the digest is squeezed back out. The state is bigger than the output,
        and the extra hidden portion is what defeats the length-extension attack
        SHA-2 inherits.
      </p>
      <p>
        No browser implements SHA-3, so WebCrypto cannot help here — this is the
        one algorithm in the module that comes from a library rather than the
        platform.
      </p>
    </>
  ),
  hybrid: (
    <>
      <p>
        Public-key cryptography solves key distribution but is slow and
        size-limited. Symmetric cryptography is fast and unlimited but needs a
        shared key. Hybrid encryption takes both: a random AES-256 key encrypts
        the message, and RSA encrypts only that 32-byte key.
      </p>
      <p>
        This is not a shortcut — it is what actually ships. TLS, PGP, S/MIME and
        age all work this way. It also reframes the usual complaint about RSA
        being slow: RSA only ever touches 32 bytes, so its cost is fixed no
        matter how large the message.
      </p>
      <p>
        The content key is generated per message and never reused, so
        compromising one message tells an attacker nothing about any other. Note
        the asymmetry in what the two halves protect: AES-GCM authenticates the
        body, but anyone holding the public key can produce a valid envelope —
        hybrid encryption gives confidentiality, not proof of sender. That needs
        a signature.
      </p>
    </>
  ),
};
