// src/main/java/JavaParserCLI.java

import com.github.javaparser.*;
import com.github.javaparser.ast.*;
import com.google.gson.*;

import java.io.FileReader;
import java.io.FileWriter;
import java.util.*;

public class JavaParserCLI {

    public static void main(String[] args) throws Exception {
        if (args.length < 2) {
            System.err.println("Usage: JavaParserCLI <input.java> <output.json-prefix>");
            System.exit(1);
        }

        String inputFile = args[0];
        String outputPrefix = args[1]; // e.g., "output" → output.pretty.json + output.min.json

        // Parse input Java file
        CompilationUnit cu = StaticJavaParser.parse(new FileReader(inputFile));

        // Recursively convert AST → JSON
        JsonObject jsonAst = nodeToJson(cu);

        // Save prettified JSON for user review
String prettyFile = outputPrefix + ".pretty.json";
try (FileWriter fw = new FileWriter(prettyFile)) {
    Gson gsonPretty = new GsonBuilder()
            .disableHtmlEscaping()
            .setPrettyPrinting()
            .create();
    gsonPretty.toJson(jsonAst, fw);
}

// Save minified JSON for the extension/LLM
String minifiedFile = outputPrefix.replace(".json", ".min.json");
try (FileWriter fw = new FileWriter(minifiedFile)) {
    Gson gsonMin = new GsonBuilder()
            .disableHtmlEscaping()
            .create();
    gsonMin.toJson(jsonAst, fw);
}

System.err.println("AST JSON written: " + prettyFile + " and " + minifiedFile);
}


    /**
     * Recursively convert a Node into JSON.
     * Includes type, begin line, comment, attributes, and children.
     */
    private static JsonObject nodeToJson(Node node) {
        JsonObject json = new JsonObject();

        // Node type
        json.addProperty("nodeType", node.getClass().getSimpleName());

        // Source position (only keep beginLine)
        node.getRange().ifPresent(range -> {
            json.addProperty("beginLine", range.begin.line);
        });

        // Attach comment if present (strip newlines + extra spaces)
        node.getComment().ifPresent(c -> {
            String clean = c.getContent()
                    .replaceAll("\\s+", " ")
                    .trim();
            json.addProperty("comment", clean);
        });

        // Properties (non-node attributes)
        JsonObject props = new JsonObject();
        node.getMetaModel().getAllPropertyMetaModels().forEach(prop -> {
            try {
                Object value = prop.getValue(node);
                if (value != null && !(value instanceof Node)) {
                    // Collapse whitespace/newlines in property values too
                    String cleanValue = value.toString()
                            .replaceAll("\\s+", " ")
                            .trim();
                    props.addProperty(prop.getName(), cleanValue);
                }
            } catch (Exception ignored) {}
        });
        if (props.size() > 0) {
            json.add("properties", props);
        }

        // Children
        List<Node> childrenNodes = node.getChildNodes();
        if (!childrenNodes.isEmpty()) {
            JsonArray children = new JsonArray();
            for (Node child : childrenNodes) {
                children.add(nodeToJson(child));
            }
            json.add("children", children);
        }

        return json;
    }
}

