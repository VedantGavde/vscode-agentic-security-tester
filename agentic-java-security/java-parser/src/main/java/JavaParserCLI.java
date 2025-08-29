// src/main/java/JavaParserCLI.java

import com.github.javaparser.*;
import com.github.javaparser.ast.*;
import com.google.gson.*;

import java.io.FileReader;
import java.io.FileWriter;

public class JavaParserCLI {

    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.err.println("Usage: JavaParserCLI <input.java> <output-pretty.json>");
            System.exit(1);
        }

        String inputFile = args[0];
        String prettyOutPath = args[1]; // e.g., "ast-output-pretty.json"

        CompilationUnit cu = StaticJavaParser.parse(new FileReader(inputFile));

        JsonObject jsonAst = nodeToJson(cu);

        try (FileWriter fw = new FileWriter(prettyOutPath)) {
            Gson gsonPretty = new GsonBuilder()
                    .disableHtmlEscaping()
                    .setPrettyPrinting()
                    .create();
            gsonPretty.toJson(jsonAst, fw);
        }

        System.out.println("AST JSON written: " + prettyOutPath);
    }

    private static JsonObject nodeToJson(Node node) {
        JsonObject json = new JsonObject();
        json.addProperty("nodeType", node.getClass().getSimpleName());

        node.getRange().ifPresent(range -> {
            json.addProperty("beginLine", range.begin.line);
        });

        node.getComment().ifPresent(c -> {
            String clean = c.getContent().replaceAll("\\s+", " ").trim();
            json.addProperty("comment", clean);
        });

        JsonObject props = new JsonObject();
        node.getMetaModel().getAllPropertyMetaModels().forEach(prop -> {
            try {
                Object value = prop.getValue(node);
                if (value != null && !(value instanceof Node)) {
                    String cleanValue = value.toString().replaceAll("\\s+", " ").trim();
                    props.addProperty(prop.getName(), cleanValue);
                }
            } catch (Exception ignored) {}
        });
        if (props.size() > 0) json.add("properties", props);

        if (!node.getChildNodes().isEmpty()) {
            JsonArray children = new JsonArray();
            for (Node child : node.getChildNodes()) {
                children.add(nodeToJson(child));
            }
            json.add("children", children);
        }

        return json;
    }
}

