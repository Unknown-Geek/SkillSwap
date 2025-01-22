class User:
    def __init__(self, username, email, skills_offered, skills_needed):
        self.username = username
        self.email = email
        self.skills_offered = skills_offered
        self.skills_needed = skills_needed

    def to_dict(self):
        return self.__dict__
