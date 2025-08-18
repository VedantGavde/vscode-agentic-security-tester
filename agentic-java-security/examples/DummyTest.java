import java.io.*;
import java.nio.file.*;
import java.security.*;
import java.sql.*;
import java.util.*;
import javax.crypto.*;
import javax.crypto.spec.*;
import javax.xml.parsers.*;
import org.w3c.dom.*;
import org.xml.sax.InputSource;

public class DummyTest {

    public static void main(String[] args) {
        System.out.println("Running mixed safe/unsafe test cases...");

        // SQL Injection
        unsafeSql("admin' OR '1'='1");
        safeSql("admin");

        // Hardcoded password
        hardcodedPassword();
        safePassword("DynamicP@ssFromConfig");

        // Authentication
        brokenAuth("admin", "wrongpassword");
        safeAuth("admin", "securePassword123");

        // Cryptography
        insecureCrypto("secretdata");
        safeCrypto("securedata");

        // File Access
        pathTraversal("../etc/passwd");
        safeFileRead("data.txt");

        // XML Parsing
        xxeVuln("<!DOCTYPE foo [ <!ELEMENT foo ANY > <!ENTITY xxe SYSTEM \"file:///etc/passwd\" >]><foo>&xxe;</foo>");
        safeXml("<foo>bar</foo>");

        // Deserialization
        deserializationVuln("serialized_payload.bin");
        safeDeserialization();

        // Session Token
        insecureSessionToken();
        safeSessionToken();

        // Command execution
        commandInjection("127.0.0.1 && echo injected");
        safeCommand("127.0.0.1");

        // Logging
        loggingSensitiveInfo("admin", "supersecret123");
        safeLogging("admin");

        System.out.println("Done.");
    }

    // ========================= SQL Injection =========================
    public static void unsafeSql(String userInput) {
        try (Connection conn = DriverManager.getConnection("jdbc:h2:mem:testdb")) {
            Statement stmt = conn.createStatement();
            String query = "SELECT * FROM users WHERE username = '" + userInput + "'";
            ResultSet rs = stmt.executeQuery(query);
            while (rs.next()) {
                System.out.println("User: " + rs.getString("username"));
            }
        } catch (Exception e) {
            System.out.println("Unsafe SQL failed: " + e.getMessage());
        }
    }

    public static void safeSql(String userInput) {
        try (Connection conn = DriverManager.getConnection("jdbc:h2:mem:testdb")) {
            PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE username = ?");
            ps.setString(1, userInput);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                System.out.println("Safe User: " + rs.getString("username"));
            }
        } catch (Exception e) {
            System.out.println("Safe SQL failed: " + e.getMessage());
        }
    }

    // ========================= Passwords =========================
    public static void hardcodedPassword() {
        String password = "P@ssw0rd123"; // Hardcoded secret
        System.out.println("Hardcoded password: " + password);
    }

    public static void safePassword(String password) {
        System.out.println("Password fetched securely at runtime: " + password);
    }

    // ========================= Authentication =========================
    public static void brokenAuth(String user, String pass) {
        if ("admin".equals(user)) { // ignoring password
            System.out.println("Login successful (broken) for: " + user);
        } else {
            System.out.println("Access denied.");
        }
    }

    public static void safeAuth(String user, String pass) {
        if ("admin".equals(user) && "securePassword123".equals(pass)) {
            System.out.println("Login successful (safe) for: " + user);
        } else {
            System.out.println("Access denied (safe).");
        }
    }

    // ========================= Cryptography =========================
    public static void insecureCrypto(String data) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(data.getBytes());
            System.out.println("MD5 hash: " + Base64.getEncoder().encodeToString(hash));

            Cipher cipher = Cipher.getInstance("AES/ECB/NoPadding");
            SecretKeySpec key = new SecretKeySpec("1234567890123456".getBytes(), "AES");
            cipher.init(Cipher.ENCRYPT_MODE, key);
            byte[] encrypted = cipher.doFinal(data.getBytes());
            System.out.println("Insecure encrypted: " + Base64.getEncoder().encodeToString(encrypted));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void safeCrypto(String data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(data.getBytes());
            System.out.println("SHA-256 hash: " + Base64.getEncoder().encodeToString(hash));

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            SecretKeySpec key = new SecretKeySpec("1234567890123456".getBytes(), "AES");
            cipher.init(Cipher.ENCRYPT_MODE, key, new javax.crypto.spec.GCMParameterSpec(128, new byte[12]));
            byte[] encrypted = cipher.doFinal(data.getBytes());
            System.out.println("Secure encrypted: " + Base64.getEncoder().encodeToString(encrypted));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ========================= File Access =========================
    public static void pathTraversal(String userInput) {
        try {
            String baseDir = "./data/";
            Path path = Paths.get(baseDir + userInput);
            String content = new String(Files.readAllBytes(path));
            System.out.println("Read file: " + content);
        } catch (Exception e) {
            System.out.println("Path traversal failed: " + e.getMessage());
        }
    }

    public static void safeFileRead(String fileName) {
        try {
            Path baseDir = Paths.get("./data/");
            Path path = baseDir.resolve(fileName).normalize();
            if (!path.startsWith(baseDir)) {
                throw new SecurityException("Invalid path access!");
            }
            String content = new String(Files.readAllBytes(path));
            System.out.println("Safe file read: " + content);
        } catch (Exception e) {
            System.out.println("Safe file read failed: " + e.getMessage());
        }
    }

    // ========================= XML Parsing =========================
    public static void xxeVuln(String xml) {
        try {
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setExpandEntityReferences(true);
            DocumentBuilder db = dbf.newDocumentBuilder();
            Document doc = db.parse(new InputSource(new StringReader(xml)));
            System.out.println("Parsed XML (unsafe): " + doc.getDocumentElement().getNodeName());
        } catch (Exception e) {
            System.out.println("XXE failed: " + e.getMessage());
        }
    }

    public static void safeXml(String xml) {
        try {
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setExpandEntityReferences(false);
            dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            DocumentBuilder db = dbf.newDocumentBuilder();
            Document doc = db.parse(new InputSource(new StringReader(xml)));
            System.out.println("Parsed XML (safe): " + doc.getDocumentElement().getNodeName());
        } catch (Exception e) {
            System.out.println("Safe XML failed: " + e.getMessage());
        }
    }

    // ========================= Deserialization =========================
    public static void deserializationVuln(String fileName) {
        try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream(fileName))) {
            Object obj = ois.readObject();
            System.out.println("Deserialized (unsafe): " + obj.toString());
        } catch (Exception e) {
            System.out.println("Deserialization failed: " + e.getMessage());
        }
    }

    public static void safeDeserialization() {
        try {
            System.out.println("Safe deserialization: using JSON instead of Java objects.");
        } catch (Exception e) {
            System.out.println("Safe deserialization failed: " + e.getMessage());
        }
    }

    // ========================= Session Token =========================
    public static void insecureSessionToken() {
        String token = String.valueOf(new Random().nextInt(999999));
        System.out.println("Insecure session token: " + token);
    }

    public static void safeSessionToken() {
        byte[] token = new byte[32];
        new SecureRandom().nextBytes(token);
        System.out.println("Secure session token: " + Base64.getEncoder().encodeToString(token));
    }

    // ========================= Command Execution =========================
    public static void commandInjection(String userInput) {
        try {
            String cmd = "ping -c 1 " + userInput;
            Process p = Runtime.getRuntime().exec(cmd);
            p.waitFor();
            System.out.println("Executed command (unsafe): " + cmd);
        } catch (Exception e) {
            System.out.println("Command injection failed: " + e.getMessage());
        }
    }

    public static void safeCommand(String host) {
        try {
            ProcessBuilder pb = new ProcessBuilder("ping", "-c", "1", host);
            Process p = pb.start();
            p.waitFor();
            System.out.println("Executed command (safe): ping " + host);
        } catch (Exception e) {
            System.out.println("Safe command failed: " + e.getMessage());
        }
    }

    // ========================= Logging =========================
    public static void loggingSensitiveInfo(String username, String password) {
        System.out.println("Login attempt: " + username + " with password " + password);
    }

    public static void safeLogging(String username) {
        System.out.println("Login attempt for user: " + username);
    }
}

