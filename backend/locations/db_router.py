# backend/locations/db_router.py
class LocationsRouter:
    """
    locations 앱은 전용 DB('locations')를 사용.
    나머지 앱은 default DB를 사용.
    """
    locations_db = 'locations'

    def db_for_read(self, model, **hints):
        if model._meta.app_label == 'locations':
            return self.locations_db
        return 'default'

    def db_for_write(self, model, **hints):
        if model._meta.app_label == 'locations':
            return self.locations_db
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        # 두 객체가 둘 다 locations DB에 있거나 둘 다 default DB에 있으면 허용
        if obj1._meta.app_label == 'locations' and obj2._meta.app_label == 'locations':
            return True
        if obj1._state.db == 'default' and obj2._state.db == 'default':
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        # locations 앱은 locations DB에서만 migrate 허용
        if app_label == 'locations':
            return db == self.locations_db
        # 다른 앱은 default DB에서만 migrate 허용
        return db == 'default'
