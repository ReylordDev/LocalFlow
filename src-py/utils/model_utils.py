from typing import Any, Dict, Optional, Set, Type
from sqlalchemy.inspection import inspect
from sqlmodel import (
    SQLModel,
)


def create_instance(model: Type[SQLModel], data: Dict[str, Any]) -> SQLModel:
    """
    Create an instance of a SQLModel using the provided data dictionary.

    This function dynamically maps nested dictionaries to corresponding ORM models.

    Args:
        model (Type[SQLModel]): The SQLModel class to instantiate.
        data (Dict[str, Any]): A dictionary containing the data to populate the model.

    Returns:
        SQLModel: An instance of the model populated with the provided data.

    Example:
        hero = create_instance(Hero, {"name": "Jason", "secret_name": "Tree"})
    """
    mapper = inspect(model)
    columns = {column.key: column for column in mapper.columns}
    relationships = {rel.key: rel for rel in mapper.relationships}

    instance_data = {}
    for key, value in (data or {}).items():
        if key in columns:
            instance_data[key] = value
        elif key in relationships:
            related_model = relationships[key].mapper.class_
            if isinstance(value, list):
                instance_data[key] = [
                    create_instance(related_model, v) for v in value if v is not None
                ]
            elif value is not None:
                instance_data[key] = create_instance(related_model, value)
            else:
                instance_data[key] = [] if relationships[key].uselist else None

    return model(**instance_data)


def dump_instance(
    instance: SQLModel, processed_ids: Optional[Set[int]] = None
) -> Dict[str, Any]:
    """
    Recursively serialize a SQLModel instance into a dictionary, including nested relationships.

    Args:
        instance (SQLModel): The SQLModel instance to serialize.
        processed_ids (Optional[Set[int]]): Set of processed instance IDs to avoid infinite recursion.

    Returns:
        Dict[str, Any]: A dictionary representation of the instance.

    Example:
        data_dict = dump_instance(hero_instance)
    """
    if processed_ids is None:
        processed_ids = set()

    instance_id = id(instance)
    if instance_id in processed_ids:
        return {}  # Prevent infinite recursion
    processed_ids.add(instance_id)

    mapper = inspect(instance.__class__)
    columns = {column.key: column for column in mapper.columns}
    relationships = {rel.key: rel for rel in mapper.relationships}

    data = {}
    for key in columns:
        data[key] = getattr(instance, key)

    for key, relationship in relationships.items():
        related_data = getattr(instance, key)
        if relationship.uselist:
            data[key] = [
                dump_instance(rel_instance, processed_ids)
                for rel_instance in related_data
            ]
        else:
            data[key] = (
                dump_instance(related_data, processed_ids) if related_data else None
            )

    return data
