package social_rank.config;

/**
 * Global configuration for NETS 2120 homeworks.
 * <p>
 * A better version of this would read a config file from the resources,
 * such as a YAML file. But our first version is designed to be simple
 * and minimal.
 *
 * @author zives
 */
public class Config {

    public static final String DATABASE_CONNECTION = "lemonpie.cbygxtsoajep.us-east-1.rds.amazonaws.com";
    public static final String DATABASE_USERNAME = "admin";
    public static final String DATABASE_PASSWORD = "rds-password";

    public static final String SPARK_APP_NAME = "SocialRank";
    public static final String SPARK_MASTER_URL = "local[*]";
    public static final String SPARK_DRIVER_MEMORY = "10g";
    public static final String SPARK_TESTING_MEMORY = "2147480000";

    /**
     * The path to the space-delimited social network data
     */
    public static String LOCAL_SPARK = "local[*]";

    // Retrieve AWS credentials from environment variables
    public static String ACCESS_KEY_ID = System.getenv("ACCESS_KEY_ID");
    public static String SECRET_ACCESS_KEY = System.getenv("SECRET_ACCESS_KEY");
    public static String SESSION_TOKEN = System.getenv("SESSION_TOKEN");

    /**
     * How many RDD partitions to use?
     */
    public static int PARTITIONS = 5;
}
