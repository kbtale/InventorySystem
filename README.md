# InventorySystemCVZ (Prompt Practice MVP)

This is a project I started a while ago and never actually finished. I dug it back up mostly to practice my "one-shot" prompting skills to see if I could force it into a working MVP state over and over again.

This is the result. It ain't exactly high-art, and the legacy database schema was a total nightmare to work with, but it's officially "functional" now.


https://github.com/user-attachments/assets/e7577616-012c-4fac-90ba-8dd75ef4b4e1


### Archived
This is just for practice. It's going straight into the archives. Don't expect production-grade code here—expect a lot of "Nuke and Pave" logic that was required just to get the database to stop crying.

### 🛠 What's in the Box?
- **The Seeding Engine**: A custom "Absolute Seed"Hierarchical routine that manages to populate a legacy MariaDB schema (that doesn't have auto-increment) with thousands of assets.
- **The Fleet**: It automatically generates a thousand-item inventory fleet from a list of real manufacturers so the dashboard isn't empty.
- **Asset CRUD**: A Quasar-based form where you can actually create and edit assets (including Health % and Cost metrics we added during the session).
- **Maintenance Hub**: A section that splits up the inventory by industrial sector.
- **Dockerized**: Containerized so it actually runs on different machines without exploding.

### How to run it (if for some reason you wanted to):
```powershell
docker-compose down -v; docker-compose up --build
```
Log in with `admin` / `admin123`.

### Final Verdict:
It was an interesting experiment in seeing how far you can push a prompt-based limited AI model (Gemini 3 Flash) to fix a "broken" project. It works, it's populated, and now it's getting archived. Peace out.
