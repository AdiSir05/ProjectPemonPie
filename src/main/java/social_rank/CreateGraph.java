package social_rank;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.api.java.function.PairFunction;
import scala.Tuple2;


public class CreateGraph {
    private static final String JDBC_URL = "jdbc:mysql://lemonpie.cbygxtsoajep.us-east-1.rds.amazonaws.com:3306/lemonpie";
    private static final String USER = "admin";
    private static final String PASSWORD = "red-password";

    public static JavaPairRDD<String, String> createGraph(JavaSparkContext sc) {
        Connection conn = null;
        Statement stmt = null;
        List<Tuple2<String, String>> edges = new ArrayList<>();

        try {
            // Register JDBC driver and open a connection
            Class.forName("com.mysql.jdbc.Driver");
            conn = DriverManager.getConnection(JDBC_URL, USER, PASSWORD);

            // Execute SQL query for users and their interests
            stmt = conn.createStatement();
            String sql = "SELECT user_id, interests FROM users";
            ResultSet rs = stmt.executeQuery(sql);
            while (rs.next()) {
                int userId = rs.getInt("user_id");
                String[] interests = rs.getString("interests").split(",");
                for (String interest : interests) {
                    String userNode = "u" + userId;
                    edges.add(new Tuple2<>(userNode, ("#" + interest.trim())));
                    edges.add(new Tuple2<>(("#" + interest.trim()), userNode));
                }
            }

            // Execute SQL query for posts and associated interests
            sql = "SELECT post_id, interests FROM posts";
            rs = stmt.executeQuery(sql);
            while (rs.next()) {
                int postId = rs.getInt("post_id");
                String[] interests = rs.getString("interests").split(",");
                for (String interest : interests) {
                    String postNode = "p" + postId;
                    edges.add(new Tuple2<>(postNode, ("#" + interest.trim())));
                    edges.add(new Tuple2<>(("#" + interest.trim()), postNode));
                }
            }

            // Execute SQL query for likes
            sql = "SELECT user_id, post_id FROM likes";
            rs = stmt.executeQuery(sql);
            while (rs.next()) {
                String userNode = "u" + rs.getInt("user_id");
                String postNode = "p" + rs.getInt("post_id");
                edges.add(new Tuple2<>(userNode, postNode));
                edges.add(new Tuple2<>(postNode, userNode));
            }

            // Execute SQL query for followers
            sql = "SELECT follower, followed FROM followers";
            rs = stmt.executeQuery(sql);
            while (rs.next()) {
                String followerNode = "u" + rs.getInt("follower");
                String followedNode = "u" + rs.getInt("followed");
                edges.add(new Tuple2<>(followerNode, followedNode));
                edges.add(new Tuple2<>(followedNode, followerNode));
            }

            rs.close();
            stmt.close();
            conn.close();

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            // Clean-up environment
            try {
                if (stmt != null) stmt.close();
            } catch (Exception se2) {}
            try {
                if (conn != null) conn.close();
            } catch (Exception se) {
                se.printStackTrace();
            }
        }

        JavaRDD<Tuple2<String, String>> edgeRDD = sc.parallelize(edges);
        JavaPairRDD<String, String> graph = edgeRDD.mapToPair(
            new PairFunction<Tuple2<String, String>, String, String>() {
                public Tuple2<String, String> call(Tuple2<String, String> t) {
                    return new Tuple2<>(t._1, t._2);
                }
            });
        return graph;
    }
}
