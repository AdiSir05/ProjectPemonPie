package social_rank;

import java.io.IOException;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.api.java.function.PairFunction;
import scala.Tuple2;


import scala.Tuple2;

import java.util.*;
import java.lang.Math;
// import CreateGraph class from the file

import org.apache.spark.sql.SparkSession; // Import SparkSession class

public class ComputeRank {
    private static final String JDBC_URL = "jdbc:mysql://lemonpie.cbygxtsoajep.us-east-1.rds.amazonaws.com:3306/lemonpie";
    private static final String USER = "admin";
    private static final String PASSWORD = "red-password";
    

    public static void main(String[] args) {
        SparkSession spark = SparkSession.builder()
            .appName("Compute Social Rank")
            .master("local[*]")  // Set the master URL here
            .getOrCreate();
        JavaSparkContext sc = new JavaSparkContext(spark.sparkContext());

        // Create the graph
        JavaPairRDD<String, String> graph = CreateGraph.createGraph(sc);

        graph.foreach(data -> {
            System.out.println(data);
        });

        // Assign initial weights
        JavaPairRDD<String, Tuple2<String, Double>> weightedGraph = graph.groupByKey().flatMapToPair(group -> {
            List<Tuple2<String, Tuple2<String, Double>>> edgesWithWeights = new ArrayList<>();
            String source = group._1;
            Iterable<String> targets = group._2;
        
            // Convert iterable to list to allow multiple iterations
            List<String> targetList = new ArrayList<>();
            targets.forEach(targetList::add);

            if (source.startsWith("u")) { // For user nodes
                long countPosts = targetList.stream().filter(t -> t.startsWith("p")).count();
                long countUsers = targetList.stream().filter(t -> t.startsWith("u")).count();
                long countHashtags = targetList.stream().filter(t -> t.startsWith("#")).count();

                for (String target : targetList) {
                    if (target.startsWith("p")) { // user to post edges
                        edgesWithWeights.add(new Tuple2<>(source, new Tuple2<>(target, countPosts > 0 ? 0.4 / countPosts : 0)));
                    } else if (target.startsWith("u")) { // user to user edges
                        edgesWithWeights.add(new Tuple2<>(source, new Tuple2<>(target, countUsers > 0 ? 0.3 / countUsers : 0)));
                    } else if (target.startsWith("#")) { // user to hashtag edges
                        edgesWithWeights.add(new Tuple2<>(source, new Tuple2<>(target, countHashtags > 0 ? 0.3 / countHashtags : 0)));
                    }
                }
            } else if (source.startsWith("p")) { // For post nodes
                // Outgoing edges from a post to hashtags or other nodes
                double weight = targetList.size() > 0 ? 1.0 / targetList.size() : 1;
                for (String target : targetList) {
                    edgesWithWeights.add(new Tuple2<>(source, new Tuple2<>(target, weight)));
                }
            } else { // For hashtag nodes
                // Outgoing edges from a hashtag to users or posts
                double weight = targetList.size() > 0 ? 1.0 / targetList.size() : 1;
                for (String target : targetList) {
                    edgesWithWeights.add(new Tuple2<>(source, new Tuple2<>(target, weight)));
                }
            }
            return edgesWithWeights.iterator();
        });

        // Compute ranks
        JavaPairRDD<String, Double> labels = weightedGraph.mapValues(v -> 1.0);

        // Run the adsorption algorithm for a maximum of 15 iterations or until convergence
        for (int i = 0; i < 15; i++) {
            JavaPairRDD<String, Double> newLabels = weightedGraph
                .join(labels)  
                .flatMapToPair(data -> {
                    List<Tuple2<String, Double>> newContributions = new ArrayList<>();

                    // Tuple2<String, Double> firstElement = data._1();
                    // Double secondElement = data._2();
                    // Double urmom = data;

                    
                    String target = data._2._1._1; 
                    Double currentLabel = data._2._2; 
                    Double weight = data._2._1._2;
                    newContributions.add(new Tuple2<>(target, currentLabel * weight));
                    return newContributions.iterator();
                })

                .reduceByKey(Double::sum);  // Sum up contributions for each node

            labels = newLabels;
        }

        // Normalize the labels to sum to 1, forming a probability distribution
        double totalWeight = labels.map(Tuple2::_2).reduce(Double::sum);
        JavaPairRDD<String, Double> normalizedLabels = labels.mapValues(weight -> weight / totalWeight);


        // Fetch post_ids created on the current day
        Set<String> todayPosts = new HashSet<>();
        try (Connection conn = DriverManager.getConnection(JDBC_URL, USER, PASSWORD);
             Statement stmt = conn.createStatement()) {
            Date today = new Date(System.currentTimeMillis()); // Current date
            ResultSet rs = stmt.executeQuery("SELECT post_id FROM posts WHERE DATE(post_date) = '" + today + "'");
            while (rs.next()) {
                todayPosts.add("p" + rs.getString("post_id")); // Ensure the prefix 'p' is added if used in the graph
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Filter and sort by ranks to get top 200 posts created today
        JavaPairRDD<Double, String> sortedRanks = normalizedLabels
            .filter(tuple -> todayPosts.contains(tuple._1)) // Filter by today's post_ids
            .mapToPair(Tuple2::swap)
            .sortByKey(false);
        List<Tuple2<Double, String>> topPosts = sortedRanks.take(200);

        // Save or update results in RDS
        try (Connection conn = DriverManager.getConnection(JDBC_URL, USER, PASSWORD);
            Statement stmt = conn.createStatement()) {
            // Clear existing data
            String sql = "DELETE FROM TopRankedPosts";
            stmt.executeUpdate(sql);

            // Insert data, removing 'p' prefix from post_id
            for (Tuple2<Double, String> entry : topPosts) {
                String postIdWithoutPrefix = entry._2.substring(1);  // Remove 'p' from 'p123'
                // insert post_id into TopRankedPosts if it doesn't exist in ShownSuggestedPost table
                sql = "INSERT INTO TopRankedPosts (post_id) VALUES ('" + postIdWithoutPrefix + "')" +
                    " WHERE NOT EXISTS (SELECT 1 FROM ShownSuggestedPosts WHERE post_id = '" + postIdWithoutPrefix + "')";
                stmt.executeUpdate(sql);
                // insert post_id into ShownSuggestedPosts is it doesn't exist
                sql = "INSERT INTO ShownSuggestedPosts (post_id) VALUES ('" + postIdWithoutPrefix + "')" +
                    " WHERE NOT EXISTS (SELECT 1 FROM ShownSuggestedPosts WHERE post_id = '" + postIdWithoutPrefix + "')";
                stmt.executeUpdate(sql);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        sc.close();
    }
}
