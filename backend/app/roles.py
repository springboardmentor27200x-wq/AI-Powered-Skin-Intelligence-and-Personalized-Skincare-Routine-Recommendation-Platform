class Role:
    """
    Allowed roles for the platform (from the project spec, Module 1).
    Stored on User.role as plain strings so they're easy to read
    straight out of the database.
    """
    USER = "user"
    CONSULTANT = "consultant"
    DERMATOLOGIST = "dermatologist"
    ADMIN = "admin"

    ALL = [USER, CONSULTANT, DERMATOLOGIST, ADMIN]

    # Roles a person can pick for themselves on the public
    # /register form. Admin accounts should be created separately
    # (seeded, or promoted by an existing admin) — never self-served.
    SELF_REGISTERABLE = [USER, CONSULTANT, DERMATOLOGIST]
