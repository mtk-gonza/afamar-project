from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.material import Material, MaterialColor, MaterialThickness
from app.repositories.material import ColorRepository, MaterialRepository, ThicknessRepository


class MaterialService:
    def __init__(self, db: Session):
        self.repo = MaterialRepository(db)
        self.color_repo = ColorRepository(db)
        self.thickness_repo = ThicknessRepository(db)

    # Materials
    def get_all(self, skip: int = 0, limit: int = 100) -> List[Material]:
        return self.repo.get_all(skip, limit)

    def get_by_id(self, material_id: int) -> Optional[Material]:
        return self.repo.get_by_id(material_id)

    def get_by_category(self, category_id: int) -> List[Material]:
        return self.repo.get_by_category(category_id)

    def create(self, data: dict) -> Material:
        return self.repo.create(data)

    def update(self, material_id: int, data: dict) -> Optional[Material]:
        material = self.repo.get_by_id(material_id)
        if not material:
            return None
        return self.repo.update(material, data)

    def delete(self, material_id: int) -> bool:
        material = self.repo.get_by_id(material_id)
        if not material:
            return False
        self.repo.delete(material)
        return True

    # Colors
    def list_colors(self) -> List[MaterialColor]:
        return self.color_repo.get_all()

    def create_color(self, data: dict) -> MaterialColor:
        return self.color_repo.create(data)

    def delete_color(self, color_id: int) -> bool:
        color = self.color_repo.get_by_id(color_id)
        if not color:
            return False
        self.color_repo.delete(color)
        return True

    # Thicknesses
    def list_thicknesses(self) -> List[MaterialThickness]:
        return self.thickness_repo.get_all()

    def create_thickness(self, data: dict) -> MaterialThickness:
        return self.thickness_repo.create(data)

    def delete_thickness(self, thickness_id: int) -> bool:
        thickness = self.thickness_repo.get_by_id(thickness_id)
        if not thickness:
            return False
        self.thickness_repo.delete(thickness)
        return True
