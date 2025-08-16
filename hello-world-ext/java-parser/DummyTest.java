public class DummyTest {
   public static void main(String[] args) throws Exception {
    DummyTest dt = new DummyTest();
    dt.testMethod();
    Thread.sleep(5000);   // <-- 5 seconds pause, gives us time to see output
    }

    public void testMethod() {
        System.out.println("Hello AST!");
    }
}

