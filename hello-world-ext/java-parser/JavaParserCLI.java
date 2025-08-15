import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.*;
import com.github.javaparser.ast.stmt.Statement;
import com.github.javaparser.ast.stmt.BlockStmt;
import com.github.javaparser.ast.expr.VariableDeclarationExpr;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import java.io.File;
import java.util.*;

public class JavaParserCLI {

    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            System.err.println("Usage: java JavaParserCLI <JavaFile>");
            System.exit(1);
        }

        File file = new File(args[0]);
        JavaParser parser = new JavaParser();
        ParseResult<CompilationUnit> result = parser.parse(file);

        if (!result.getResult().isPresent()) {
            System.err.println("Error: Could not parse file " + file.getName());
            System.exit(1);
        }

        CompilationUnit cu = result.getResult().get();
        Map<String, Object> astJson = new LinkedHashMap<>();

        cu.getPrimaryType().ifPresent(type -> {
            if (type.isClassOrInterfaceDeclaration()) {
                ClassOrInterfaceDeclaration cls = (ClassOrInterfaceDeclaration) type;
                astJson.put("type", cls.isInterface() ? "Interface" : "Class");
                astJson.put("name", cls.getNameAsString());

                // Fields
                List<String> fieldsList = new ArrayList<>();
                for (FieldDeclaration field : cls.getFields()) {
                    fieldsList.add(field.toString().trim());
                }
                astJson.put("fields", fieldsList);

                // Methods
                List<Map<String, Object>> methodsList = new ArrayList<>();
                for (MethodDeclaration method : cls.getMethods()) {
                    Map<String, Object> methodMap = new LinkedHashMap<>();
                    methodMap.put("name", method.getNameAsString());
                    methodMap.put("parameters", method.getParameters().toString());
                    methodMap.put("returnType", method.getType().toString());

                    // Local variables
                    List<String> localVars = new ArrayList<>();
                    method.getBody().ifPresent(body -> {
                        for (Statement stmt : body.getStatements()) {
                            // Detect local variable declarations
                            stmt.findAll(VariableDeclarationExpr.class).forEach(varDecl -> {
                                localVars.add(varDecl.toString().trim());
                            });
                        }
                    });
                    methodMap.put("localVariables", localVars);

                    // Method body statements
                    List<String> bodyStatements = new ArrayList<>();
                    method.getBody().ifPresent(body -> {
                        for (Statement stmt : body.getStatements()) {
                            bodyStatements.add(stmt.toString().trim());
                        }
                    });
                    methodMap.put("body", bodyStatements);

                    methodsList.add(methodMap);
                }
                astJson.put("methods", methodsList);
            }
        });

        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        System.out.println(gson.toJson(astJson));
    }
}

