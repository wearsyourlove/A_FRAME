package main

import (
    "crypto/sha256"
    "database/sql"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "time"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/session"
    "github.com/gofiber/websocket/v2"
    _ "github.com/mattn/go-sqlite3"
)
func main() {
    app := fiber.New()

    // Enable CORS (Fixes issues with browser requests via NGINX)
    app.Use(cors.New(cors.Config{
        AllowOrigins: "*",
        AllowMethods: "GET,POST,OPTIONS",
        AllowHeaders: "Content-Type",
    }))

    db, err := sql.Open("sqlite3", "/var/lib/wylxyz/knowledge.db")
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    defer db.Close()

    // Middleware to log requests
    app.Use(func(c *fiber.Ctx) error {
        log.Println("Incoming request:", c.Method(), c.Path())
        return c.Next()
    })
   
    //User Login
    app.Post("/api/login", func(c *fiber.Ctx) error {
    var data struct {
        Username string `json:"username"`
    }
    if err := c.BodyParser(&data); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
    }

    // Generate a random session token
    token := fmt.Sprintf("%x", sha256.Sum256([]byte(data.Username+time.Now().String())))

    _, err := db.Exec("INSERT INTO sessions (username, token) VALUES (?, ?)", data.Username, token)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Failed to create session"})
    }

    return c.JSON(fiber.Map{"token": token})
})



    
    //IIRC CHAT 
    app.Get("/api/chat/:topic", websocket.New(func(c *websocket.Conn) {
    topic := c.Params("topic")
    for {
        _, msg, err := c.ReadMessage()
        if err != nil {
            break
        }
        log.Printf("[Chat - %s] %s\n", topic, string(msg))
        c.WriteMessage(websocket.TextMessage, []byte(msg))
    }
}))

    
// API Topic Title 
    app.Get("/api/topics/:title", func(c *fiber.Ctx) error {
    topic := c.Params("title")

    // Query the database for topic details
    query := `
        SELECT t.title, t.content, GROUP_CONCAT(links.url) 
        FROM topics t
        LEFT JOIN topic_links links ON t.id = links.topic_id
        WHERE t.title = ?
        GROUP BY t.id
    `
    var title, content, links string
    err := db.QueryRow(query, topic).Scan(&title, &content, &links)
    if err != nil {
        return c.Status(404).JSON(fiber.Map{"error": "Topic not found"})
    }

    return c.JSON(fiber.Map{
        "title": title,
        "content": content,
        "links":  links,
    })
})

    
    // API Endpoint: Get All Topics
    app.Get("/api/topics", func(c *fiber.Ctx) error {
        log.Println("Received request for /api/topics")

        rows, err := db.Query("SELECT title, content FROM topics")
        if err != nil {
            log.Println("Database query error:", err)
            return c.Status(500).JSON(fiber.Map{"error": "Database error"})
        }
        defer rows.Close()

        var topics []fiber.Map
        for rows.Next() {
            var title, content string
            if err := rows.Scan(&title, &content); err != nil {
                log.Println("Row scan error:", err)
                continue
            }
            topics = append(topics, fiber.Map{"title": title, "content": content})
        }

        if len(topics) == 0 {
            return c.Status(404).JSON(fiber.Map{"error": "No topics found"})
        }

        return c.JSON(topics)
    })

    // API Endpoint: Get Related Topics (X + Y + Z)
    app.Get("/api/related/:title", func(c *fiber.Ctx) error {
        title := c.Params("title")
        log.Printf("Received request for /api/related/%s", title)

        query := `
            SELECT t2.title, t3.title FROM topic_relations
            JOIN topics t1 ON topic_relations.topic1_id = t1.id
            LEFT JOIN topics t2 ON topic_relations.topic2_id = t2.id
            LEFT JOIN topics t3 ON topic_relations.topic3_id = t3.id
            WHERE t1.title = ? OR t2.title = ? OR t3.title = ?
        `
        rows, err := db.Query(query, title, title, title)
        if err != nil {
            log.Println("Database query error:", err)
            return c.Status(500).JSON(fiber.Map{"error": "Database error"})
        }
        defer rows.Close()

        var results []fiber.Map
        for rows.Next() {
            var topic1, topic2 string
            if err := rows.Scan(&topic1, &topic2); err != nil {
                log.Println("Row scan error:", err)
                continue
            }
            results = append(results, fiber.Map{"related_1": topic1, "related_2": topic2})
        }

        if len(results) == 0 {
            return c.Status(404).JSON(fiber.Map{"error": "No related topics found"})
        }
        return c.JSON(results)
    })

    log.Println("Server started on http://0.0.0.0:8080")
    log.Fatal(app.Listen("0.0.0.0:8080"))
}
